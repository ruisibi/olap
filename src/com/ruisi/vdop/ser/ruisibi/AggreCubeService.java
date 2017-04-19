package com.ruisi.vdop.ser.ruisibi;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.util.PasswordEncrypt;
import com.ruisi.vdop.ser.utils.DBUtils;
import com.ruisi.vdop.ser.utils.DataService;

/**
 * 从原始表聚集生成新的立方体，以提高查询效率。
 * @author hq
 * @date 2014-11-12
 */
public class AggreCubeService {
	
	protected JSONObject cube;
	protected JSONObject dset;
	protected JSONObject dsource;
	
	public AggreCubeService(JSONObject cube, JSONObject dset, JSONObject dsource){
		this.cube = cube;
		this.dset = dset;
		this.dsource = dsource;
	}
	
	public String proces() throws SQLException{
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(dsource);
		String tableSuffix = "_ar";
		String sql = this.createsql(rsds, tableSuffix, null);
		return this.executesql(sql, tableSuffix, rsds);
	}
	
	/**
	 * 数据聚合 只聚合主表（在表关联时设置的主表），不聚合码表
	 * @param rsds
	 * @return
	 */
	public String createsql(DataService.RSDataSource rsds, String tableSuffix, String whereKey){
		StringBuffer sql = new StringBuffer("");
		String table = this.dset.getString("master");
		String ntname = table + tableSuffix;
		String dbtp = rsds.getType();
		if("mysql".equals(dbtp) || "oracle".equals(dbtp)){
			sql.append("create table "+ ntname + " as \n");
		}
		sql.append(" select ");
	
		List<String> dls = new ArrayList<String>();
		//查询维度
		JSONArray dims = cube.getJSONArray("dim");
		for(int i=0; i<dims.size(); i++){
			JSONObject dim = dims.getJSONObject(i);
			String tp = (String)dim.get("tp");
			if("group".equals(tp)){
				JSONArray child = dim.getJSONArray("children");
				for(int j=0; j<child.size(); j++){
					JSONObject dim2 = child.getJSONObject(j);
					String col = dim2.getString("col");
					String tname = dim2.getString("tname");
					if(!tname.equals(table)){  //只聚合主表
						continue;
					}
					if(dim2.getBoolean("dyna") == true){
						sql.append(col);
						sql.append(" " + dim2.getString("refId"));
						dls.add(col);
					}else{
							sql.append( col);
							dls.add( col);
					}
					sql.append(",");
				}
			}else{
				String col = dim.getString("col");
				String tname = dim.getString("tname");
				if(!tname.equals(table)){  //只聚合主表
					continue;
				}
				if(dim.getBoolean("dyna") == true){
					sql.append(col);
					sql.append(" " + dim.getString("refId"));
					dls.add(col);
				}else{
					sql.append(col);
					dls.add(col);
					
				}
				sql.append(",");
			}
		}
		//查询关联字段
		JSONArray joins = (JSONArray)dset.get("joininfo");
		for(int j=0; joins != null && j<joins.size(); j++){
			JSONObject join = joins.getJSONObject(j);
			String col = (String)join.get("col");
			if(!dls.contains(col)){
				sql.append(col);
				sql.append(",");
				dls.add(col);
			}
		}
		//查询指标
		JSONArray kpis = cube.getJSONArray("kpi");
		for(int i=0; i<kpis.size(); i++){
			JSONObject kpi = kpis.getJSONObject(i);
			boolean calc = kpi.getBoolean("calc");
			if(!calc){
				String col = kpi.getString("col");
				String aggre = kpi.getString("aggre");
				String tname = kpi.getString("tname");
				if(!tname.equals(table)){  //只聚合主表
					continue;
				}
				sql.append(aggre + "(" + col + ") as " + col);
				sql.append(",");
			}
		}
		sql = new StringBuffer(sql.substring(0, sql.length() - 1));
		if("sqlser".equals(dbtp) || "sqlserver".equals(dbtp)){
			sql.append(" into " + ntname);
		}
		sql.append(" from " + table);
		if(whereKey != null && whereKey.length() > 0){
			sql.append(" where " + whereKey);
		}
		sql.append(" group by ");
		for(int i=0; i<dls.size(); i++){
			String d = dls.get(i);
			sql.append(d);
			if(i != dls.size() - 1){
				sql.append(",");
			}
		}
		String ret = sql.toString().replaceAll("@", "'");
		System.out.println(ret);
		return ret;
	}
	
	public String executesql(String sql, String tableSuffix, DataService.RSDataSource rsds) throws SQLException{
		Connection conn  = null;
		try {
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = DBUtils.getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = DBUtils.getConnection(rsds.getJdniname());
			}
			
			//先移除表
			String table = this.dset.getString("master");
			String newtname = table + tableSuffix;
			dropTable(conn, newtname, rsds.getType());
			
			PreparedStatement ps = conn.prepareStatement(sql);
			ps.executeUpdate();
			ps.close();
			
			return newtname;
		}catch(SQLException e){
			e.printStackTrace();
			throw e;
		}finally{
			DBUtils.closeConnection(conn);
		}
	}
	
	public static void dropTable(Connection conn, String newtname, String dbtp){
		String drop = "";
		if("mysql".equals(dbtp)){
			drop = "drop table if exists "+ newtname +"";
		}else if("sqlser".equals(dbtp) || "sqlserver".equals(dbtp)){
			drop = "if OBJECT_ID('"+newtname+"') is not null drop table " + newtname;
		}else if("oracle".equals(dbtp)){
			drop = "drop table " + newtname;
		}
		try{
			PreparedStatement ps = conn.prepareStatement(drop);
			ps.executeUpdate();
			ps.close();
		}catch(Exception ex){
			ex.printStackTrace();
		}
	}
	
}
