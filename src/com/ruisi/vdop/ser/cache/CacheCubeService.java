package com.ruisi.vdop.ser.cache;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectOutputStream;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.util.PasswordEncrypt;
import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.bean.User;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.ser.utils.DBUtils;
import com.ruisi.vdop.ser.utils.DataService;

/**
 * 数据缓存预处理对象， 通过预处理提高CUBE的查询效率
 * @author hq
 * @date 2014-11-18
 */
public class CacheCubeService extends Thread {
	
	//保存当前缓存的状态信息
	private static CacheInfoVO cacheInfo = null;
	
	static {
		if(cacheInfo == null){
			cacheInfo = new CacheInfoVO();
		}
	}
	
	private String ids;
	private ServletContext ctx;
	private CacheSqlService sqlService;
	private DataService dataSer = new DataService();
	private String path;
	private User user; //当前用户，根据用户机构ID判断数据权限时，需要用到User对象
	
	public CacheCubeService(String ids, User user,ServletContext ctx){
		this.ids = ids;
		this.ctx = ctx;
		this.path = ctx.getRealPath("/") + "/cache/";
		this.user = user;
		sqlService  = new CacheSqlService(user);
	}
	
	
	
	@Override
	public void run() {
		try {
			this.proces();
		} catch (Exception e) {
			//如果有异常，终止缓存
			cacheInfo.setEndTime(System.currentTimeMillis());
			cacheInfo.setState(false);
			e.printStackTrace();
		}
	}



	public void proces() throws IOException, ClassNotFoundException {
		cacheInfo.setStartTime(System.currentTimeMillis());
		cacheInfo.setState(true);
		FileService fs = new FileService(ctx);
		String[] id = ids.split(",");
		for(String i : id){
			ReportVO rvo = fs.readReport(i, false, 1);
			String json = rvo.getPageInfo();
			this.dealCubeJson(json);
		}
		cacheInfo.setEndTime(System.currentTimeMillis());
		cacheInfo.setState(false);
	}
	
	private void dealCubeJson(String json){
		//查询立方体
		JSONObject report = JSONObject.fromObject(json);
		JSONArray cubes = report.getJSONArray("cube");
		for(int i=0; i<cubes.size(); i++){
			JSONObject cube = cubes.getJSONObject(i);
			Object cache = cube.get("cache");
			if(cache == null || cache.toString().equalsIgnoreCase("false")){
				continue;
			}
			JSONArray dimJsons = cube.getJSONArray("dim");
			JSONArray cacheKpi = cube.getJSONArray("kpi");
			JSONArray dsets = report.getJSONArray("dataset");
			JSONObject dset = sqlService.getDataSetById(cube.getString("datasetid"), dsets);
			JSONArray dsource = report.getJSONArray("datasource");
			Connection conn = null;
			DataService.RSDataSource rsds = dataSer.json2datasource(this.sqlService.getDataSourceById(dset.getString("dsid"), dsource));
			try {
				String use = rsds.getUse();
				if(use == null || "jdbc".equals(use)){
					conn = DBUtils.getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
				}else{
					conn = DBUtils.getConnection(rsds.getJdniname());
				}
				List dims = listDims(dimJsons);
				this.randomDim(dims, cacheKpi, dset, cube, conn);
			} catch (Exception e) {
				e.printStackTrace();
				throw new RuntimeException("sql 执行报错.");
			}finally{
				DBUtils.closeConnection(conn);
			}
		}
	}
	
	/**
	 * 随机维度, 生成缓存对象, 对于已存在的缓存，忽略
	 * @throws Exception 
	 */
	private void randomDim(List<JSONObject> dims, JSONArray cacheKpi, JSONObject dset, JSONObject cube, Connection conn) throws Exception{
		String master = dset.getString("master");
		String cubeId = cube.getString("id");
		String aggreTable = (String)cube.get("aggreTable");
		if(aggreTable == null || aggreTable.length() == 0){
			aggreTable = null;
		}
		//不取维
		JSONObject[] inputDim = new JSONObject[0];
		String sql = this.sqlService.createSql(inputDim, cacheKpi, dset, aggreTable);
		String key = sqlService.createCacheKey(cubeId, inputDim, master);
		if(!this.keyExsit(key, cubeId, 0)){  //对于已缓存数据，不缓存。
			List ls = DBUtils.querySql(sql, conn);
			this.putCache(key, cubeId, 0, ls);
			cacheInfo.next();
		}
		
		
		//取一个维
		inputDim = new JSONObject[1];
		for(JSONObject dim : dims){
			inputDim[0] = dim;
			key = sqlService.createCacheKey(cubeId, inputDim, master);
			if(!this.keyExsit(key, cubeId, 1)){  //对于已缓存数据，不缓存。
				sql = this.sqlService.createSql(inputDim, cacheKpi, dset, aggreTable);
				this.putCache(key, cubeId, 1, DBUtils.querySql(sql, conn));
				cacheInfo.next();
			}
		}
		
		//取2个维
		inputDim = new JSONObject[2];
		for(int i=0; i<dims.size(); i++){
			for(int j=i+1; j<dims.size(); j++){
				inputDim[0] = dims.get(i);
				inputDim[1] =dims.get(j);
				key = sqlService.createCacheKey(cubeId, inputDim, master);
				sql = this.sqlService.createSql(inputDim, cacheKpi, dset, aggreTable);
				List nls = DBUtils.querySql(sql, conn);
				if(!this.keyExsit(key, cubeId, 2)){
					this.putCache(key, cubeId, 2, nls);
					cacheInfo.next();
				}
				
				//设置维vals
				for(int k=0; k<2; k++){
					List<Object> value1s = sqlService.getDimValues(nls, inputDim[k]);
					for(Object val : value1s){
						if(val == null){
							continue;
						}
						String alias = sqlService.getDataColAlias(inputDim[k]);
						boolean exist = this.dataExist(alias, val, nls);
						if(!exist){
							continue;
						}
						inputDim[k].put("vals", String.valueOf(val));
						sql = this.sqlService.createSql(inputDim, cacheKpi, dset, aggreTable);
						key = sqlService.createCacheKey(cubeId, inputDim, master);
						if(!this.keyExsit(key, cubeId, 2)){
							this.putCache(key, cubeId, 2, DBUtils.querySql(sql, conn));
							cacheInfo.next();
						}
					}
					inputDim[k].remove("vals");
				}
			}
		}
		//取3个维
		if(dims.size() >= 3){
			inputDim = new JSONObject[3];
			for(int i=0; i<dims.size(); i++){
				for(int j=i+1; j<dims.size(); j++){
					for(int k=j+1; k<dims.size(); k++){
						inputDim[0] = dims.get(i);
						inputDim[1] =dims.get(j);
						inputDim[2] = dims.get(k);
						sql = this.sqlService.createSql(inputDim, cacheKpi, dset, aggreTable);
						List nls = DBUtils.querySql(sql, conn);
						key = sqlService.createCacheKey(cubeId, inputDim, master);
						this.putCache(key, cubeId, 3, nls);
						cacheInfo.next();
						
						//单个维设置vals
						for(int l=0; l<3; l++){
							List<Object> value1s = sqlService.getDimValues(nls, inputDim[l]);
							for(Object val : value1s){
								inputDim[l].put("vals", String.valueOf(val));
								sql = this.sqlService.createSql(inputDim, cacheKpi, dset, aggreTable);
								key = sqlService.createCacheKey(cubeId, inputDim, master);
								if(!this.keyExsit(key, cubeId, 3)){
									this.putCache(key, cubeId, 3, DBUtils.querySql(sql, conn));
									cacheInfo.next();
								}
							}
							inputDim[l].remove("vals");
						}
						//两个维设置vals
						for(int d1=0; d1<3; d1++){
							for(int d2=d1+1; d2<3; d2++){
								List<Object> valuels1 = sqlService.getDimValues(nls, inputDim[d1]);
								List<Object> valuels2 = sqlService.getDimValues(nls, inputDim[d2]);
								String alias1 = sqlService.getDataColAlias(inputDim[d1]);
								String alias2 = sqlService.getDataColAlias(inputDim[d2]);
								for(int vidx = 0; vidx < valuels1.size(); vidx++){
									for(int vidx2 = 0; vidx2 < valuels2.size(); vidx2++){
										Object v1 = valuels1.get(vidx);
										Object v2 = valuels2.get(vidx2);
										//判断是否有数据
										boolean exist = this.dataExist(alias1, v1, alias2, v2, nls);
										if(!exist){
											continue;
										}
										inputDim[d1].put("vals", String.valueOf(v1));
										inputDim[d2].put("vals", String.valueOf(v2));
										sql = this.sqlService.createSql(inputDim, cacheKpi, dset, aggreTable);
										key = sqlService.createCacheKey(cubeId, inputDim, master);
										if(!this.keyExsit(key, cubeId, 3)){
											this.putCache(key, cubeId, 3, DBUtils.querySql(sql, conn));
											cacheInfo.next();
										}
									}
								}
								inputDim[d1].remove("vals");
								inputDim[d2].remove("vals");
							}
						}
					}
				}
			}
		}
	}
	private boolean dataExist(String col1, Object val1, List datas){
		boolean ret = false;
		for(int i=0; i<datas.size(); i++){
			Map m = (Map)datas.get(i);
			Object m1 =  m.get(col1);
			if(m1 != null && m1.equals(val1)){
				ret = true;
				break;
			}
		}
		return ret;
	}
	
	private boolean dataExist(String col1, Object val1, String col2, Object val2, List datas){
		boolean ret = false;
		for(int i=0; i<datas.size(); i++){
			Map m = (Map)datas.get(i);
			Object m1 =  m.get(col1);
			Object m2 = m.get(col2);
			if(m1 != null && m2 != null && m1.equals(val1) && m2.equals(val2)){
				ret = true;
				break;
			}
		}
		return ret;
	}
	
	private List listDims(JSONArray dims){
		List ret = new ArrayList();
		for(int i=0; i<dims.size(); i++){
			JSONObject json = dims.getJSONObject(i);
			String tp = json.getString("tp");
			if("group".equals(tp)){
				JSONArray child = (JSONArray)json.get("children");
				if(child != null && !child.isEmpty()){
					for(int j=0; j<child.size(); j++){
						ret.add(child.get(j));
					}
				}
			}else{
				ret.add(json);
			}
		}
		return ret;
	}
	
	public boolean keyExsit(String key, String cubeId, int dimsize){
		String file = this.path + "/" + cubeId + "/" + dimsize + "/" + key;
		File f = new File(file);
		return f.exists();
	}
	
	public synchronized void putCache(String key, String cubeId, int dimsize, List datas) throws Exception{		
		String file = this.path + "/" + cubeId + "/" + dimsize + "/" + key;
		File f = new File(this.path + "/" + cubeId + "/" + dimsize);
		if(!f.exists()){
			f.mkdirs();
		}
		FileOutputStream fos = new FileOutputStream(file);
		ObjectOutputStream oout = new ObjectOutputStream(fos);
		oout.writeObject(datas);
		oout.close();
		fos.close();
	}
	
	public synchronized static CacheInfoVO getCacheInfo() {
		return cacheInfo;
	}
}
