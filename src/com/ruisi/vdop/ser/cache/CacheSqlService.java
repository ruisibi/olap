package com.ruisi.vdop.ser.cache;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.vdop.bean.User;
import com.ruisi.vdop.ser.ruisibi.DataControlInterface;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 在cache过程中生成SQL
 * @author hq
 * @date 2014-11-18
 */
public class CacheSqlService {
	
	private Map<String, String> tableAlias = new HashMap<String, String>(); //表名称与别名的键值对
	
	private DataControlInterface dataControl; //数据权限控制
	private User user; //当前用户，根据用户机构ID判断数据权限时，需要用到User对象

	public CacheSqlService(User user){
		String clazz = ExtContext.getInstance().getConstant("dataControl");
		if(clazz != null && clazz.length() != 0){
			try {
				dataControl = (DataControlInterface)Class.forName(clazz).newInstance();
			} catch (Exception e) {
				e.printStackTrace();
			} 
		}
		this.user = user;
	}
	
	public void clearTables(){
		tableAlias.clear();
	}
	
	public String getDataColAlias(JSONObject dim){
		String id = dim.getString("id");
		String tname = (String)dim.get("codetable");
		String tcol = (String)dim.get("keycol");
		String tcolName = (String)dim.get("valcol");
		String alias = null;
		//判断维度是否关联了码表
		if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
			//未关联码表
			boolean dyna = dim.getBoolean("dyna"); //是否动态列, 动态列采用 d_id 的 alias
			String incomeTable = dim.getString("tname");
			alias = dyna ? "d_" + id : (tableAlias.get(incomeTable) + "_" + dim.getString("col"));
		}else{
			//关联了码表
			alias = tableAlias.get(tname) + "_" + tcol; //别名 + 列
		}
		return alias;
	}
	
	public List<Object> getDimValues(List datas, JSONObject dim){
		String alias = this.getDataColAlias(dim);
		List<Object> vals = new ArrayList<Object>();
		for(int i=0; i<datas.size(); i++){
			Map map = (Map)datas.get(i);
			Object val = map.get(alias);
			if(val == null){
				continue;
			}
			if(!vals.contains(val)){
				vals.add(val);
			}
		}
		return vals;
	}
	
	public String createCacheKey(String cubeId, JSONObject[] dims, String master){
		StringBuffer ret = new StringBuffer("");
		for(JSONObject vo : dims){
			JSONObject dim = vo;
			ret.append(dim.getString("id"));
			if(dim.get("vals") != null){
				ret.append(dim.get("vals"));
			}
		}
		String dataControlKey = null;
		if(dataControl != null){
			dataControlKey = dataControl.process(user, tableAlias, master);
			if(dataControlKey != null){
				ret.append(dataControlKey);
			}
		}
		
		return VDOPUtils.getMD5((cubeId+ret).getBytes());
	}
	
	public JSONObject getDataSetById(String id, JSONArray dsets){
		JSONObject ret = null;
		for(int i=0; i<dsets.size(); i++){
			JSONObject dset = dsets.getJSONObject(i);
			if(dset.getString("datasetid").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	}
	
	public JSONObject getDataSourceById(String id, JSONArray dsource){
		JSONObject ret = null;
		for(int i=0; i<dsource.size(); i++){
			JSONObject dset = dsource.getJSONObject(i);
			if(dset.getString("dsid").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	}
		
	public String createSql(JSONObject[] dims, JSONArray cacheKpi, JSONObject dset, String aggreTable) {
		this.clearTables(); // 先清除数据
		//先获取需要关联的表及表别名字段
		JSONArray joinTabs = dset.getJSONArray("joininfo");
		String master = dset.getString("master");
		tableAlias.put(master, "a0");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			tableAlias.put(tab.getString("ref"), "a" + (i+1));
		}
		
		List<String> useTables = new ArrayList(); //sql 会使用的表
		
		StringBuffer sb = new StringBuffer("select ");
		//查询需要缓存的指标
		for(int i=0; cacheKpi!=null&&i<cacheKpi.size(); i++){
			JSONObject kpi = cacheKpi.getJSONObject(i);
			boolean calc = kpi.getBoolean("calc"); //判断是否是计算指标
			if(calc){
				sb.append(kpi.getString("col")); //不要tname 和 aggre
			}else{
				sb.append(kpi.getString("aggre") + "("+tableAlias.get(kpi.getString("tname"))+"."+kpi.getString("col")+") ");
			}
			sb.append(kpi.getString("aggre") + "_" + kpi.getInt("id")); //alias =  k.aggre+"_" + k.id; 
			sb.append(",");
		}
		
		List<String> groupCols = new ArrayList<String>(); //需要进行分组的字段
		List<JSONObject> filterCols = new ArrayList<JSONObject>(); //需要进行过滤的维度
		//查询维度
		for(int i=0; i<dims.length; i++){
			JSONObject col = dims[i];
			String id = col.getString("id");
			String tname = (String)col.get("codetable");
			String tcol = (String)col.get("keycol");
			String tcolName = (String)col.get("valcol");
			if(aggreTable != null){  //走聚合表
				col.put("col", col.get("refId"));
			}
			//判断维度是否关联了码表
			if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
				//未关联码表
				boolean dyna = col.getBoolean("dyna"); //是否动态列, 动态列采用 d_id 的 alias
				String incomeTable = col.getString("tname");
				String str1 = dyna ? col.getString("col") : tableAlias.get(incomeTable) + "." +col.getString("col");
				sb.append(str1);
				sb.append(" as " + (dyna ? "d_" + id : tableAlias.get(incomeTable) + "_" + col.getString("col")));
				sb.append(",");
				groupCols.add(str1);
			}else{
				//关联了码表
				String str1 = tableAlias.get(tname)+"."+tcol;
				sb.append(str1);
				sb.append(" as " + tableAlias.get(tname) + "_" + tcol); //别名 + 列
				sb.append(",");
				String str2 = tableAlias.get(tname)+"."+tcolName;
				sb.append(str2);
				sb.append(" as " + tableAlias.get(tname)+"_"+tcolName);
				sb.append(",");
				useTables.add(tname); //把当前维度表放入SQL会使用的表中。
				
				groupCols.add(str1);
				groupCols.add(str2);
			}
			String vals = (String)col.get("vals");
			if(vals != null && vals.length() > 0){
				filterCols.add(col);
			}
		}
		//去除逗号
		sb = new StringBuffer(sb.substring(0, sb.length() - 1));
		sb.append(" ");
		
		sb.append("from ");
		
		sb.append((aggreTable == null || aggreTable.length() == 0 ? master : aggreTable)  + " " + tableAlias.get(master));
		for(int i=0; i<joinTabs.size(); i++){  //通过主表关联
			JSONObject tab = joinTabs.getJSONObject(i);
			String ref = tab.getString("ref");
			String refKey = tab.getString("refKey");
			String jtype = (String)tab.get("jtype");
			String force = (String)tab.get("force"); //是否强制链接
			if("y".equals(force) || useTables.contains(ref)){  //强制连接及已有表，进行关联
				if("left".equals(jtype) || "right".equals(jtype)){
					sb.append(" " + jtype);
				}
				sb.append(" join " + ref+ " " + tableAlias.get(ref));
				sb.append(" on a0."+tab.getString("col")+"="+tableAlias.get(ref)+"."+refKey);
				sb.append(" ");
			}
		}
		sb.append(" where 1=1 ");
		//数据权限控制筛选
		if(dataControl != null){
			String ret = dataControl.process(user, tableAlias, dset.getString("master"));
			if(ret != null){
				sb.append(ret + " ");
			}
		}
		Object o = dset.get("param");
		//添加筛选 (数据集的筛选)
		if(o != null){
			JSONArray params = (JSONArray)o;
			for(int i=0; i<params.size(); i++){
				JSONObject p = (JSONObject)params.get(i);
				String col = p.getString("col");
				String tname = p.getString("tname");
				String type = p.getString("type");
				String val = p.getString("val");
				String val2 = p.getString("val2");
				if(val == null || val.length() == 0){
					continue;
				}
				sb.append(" and "+tableAlias.get(tname)+"."+col);
				sb.append(type);
				if("string".equals(type)){
					sb.append(val);
				}else{
					sb.append("'");
					sb.append(val);
					sb.append("'");
				}
				if("between".equals(type)){
					sb.append(" and ");
					if("string".equals(type)){
						sb.append(val2);
					}else{
						sb.append("'");
						sb.append(val2);
						sb.append("'");
					}
				}
				sb.append(" ");
			}
		}
		
		//处理过滤 (维度过滤 vals)
		for(JSONObject filter : filterCols){
			String val = filter.getString("vals");
			if(val == null || val.length() == 0){
				continue;
			}
			String valType = filter.getString("vtype");
			boolean dyna = filter.getBoolean("dyna");
			val = VDOPUtils.dealStringParam(val, valType);
			
			String tname = filter.getString("tname");
			if(tname == null || tname.length() == 0 || dset.getString("master").equals(tname)){
				tname = "a0";
			}else{
				tname = this.tableAlias.get(tname);
			}
			
			//如果是dyna 动态列做过滤字段，不加前面的a0
			sb.append("and " + (dyna ? "" : tname+".") + filter.getString("col") + " in ("+val+") ");
		}
		//增加GROUP BY
		if(groupCols.size() > 0){
			sb.append("group by ");
			for(int i=0; i<groupCols.size(); i++){
				String col = groupCols.get(i);
				sb.append(col);
				if(i != groupCols.size() - 1){
					sb.append(",");
				}
			}
		}
		String ret = sb.toString().replaceAll("@", "'");
		System.out.println(ret);
		return ret;
	}
}
