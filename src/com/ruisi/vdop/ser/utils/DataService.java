package com.ruisi.vdop.ser.utils;

import java.util.HashMap;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

public class DataService {
	public static final String mysql = "com.mysql.jdbc.Driver";
	public static final String oracle = "oracle.jdbc.driver.OracleDriver";
	public static final String sqlserver = "net.sourceforge.jtds.jdbc.Driver";
	
	public static final String showTables_mysql = "select table_name from information_schema.tables where table_schema='$0' and table_type='BASE TABLE'";
	public static final String showTables_oracle = "select table_name from tabs";
	public static final String showTables_sqlser = "select name from sysobjects where xtype='U' order by name";
	
	public static final String showViews_mysql = "select table_name from information_schema.views where table_schema='$0'";
	public static final String showViews_oracle = "select view_name from user_views";
	public static final String showViews_sqlser = "select name from sysobjects where xtype='V' order by name";
	
	public static final String[] dataTypes = new String[]{"String", "Int", "Double", "Date"}; 
	
	public RSDataSource json2datasource(JSONObject obj){
		DataService.RSDataSource ds = new RSDataSource();
		Object use = obj.get("use");
		ds.setUse(use == null ? null : use.toString());
		if(use == null || "jdbc".equalsIgnoreCase(use.toString())){
			ds.setName(obj.getString("linkname"));
			ds.setPsd(obj.getString("linkpwd"));
			ds.setUrl(obj.getString("linkurl"));
			String linktype = obj.getString("linktype");
			ds.setType(linktype);
			if(linktype.equals("mysql")){
				ds.setLinktype(mysql);
			}else if(linktype.equals("oracle")){
				ds.setLinktype(oracle);
			}else if(linktype.equals("sqlserver")){
				ds.setLinktype(sqlserver);
			}
		}else{
			ds.setJdniname(obj.getString("jndiname"));
		}
		return ds;
	}

	/**
	 * 根据dataset的配置信息，拼接出dataset的sql
	 * @param obj
	 * @return
	 */
	public String createDatasetSql(JSONObject obj){
		Map<String, String> tableAlias = new HashMap<String, String>(); //表名称与别名的键值对
		StringBuffer sb = new StringBuffer("select a0.* ");
		JSONArray joinTabs = obj.getJSONArray("joininfo");
		for(int i=0; i<joinTabs.size(); i++){
			sb.append(", a"+(i+1)+".* ");
		}
		sb.append("from ");
		sb.append(obj.getString("master") + " a0 ");
		tableAlias.put(obj.getString("master"), "a0");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			sb.append(", "+tab.getString("ref")+" a"+(i+1)+" ");
			tableAlias.put(tab.getString("ref"), "a" + (i+1));
		}
		sb.append("where 1=1 ");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			sb.append("and a0."+tab.getString("col")+"=a"+(i+1)+"."+tab.getString("refKey"));
			sb.append(" ");
		}
		//添加筛选
		Object o = obj.get("param");
		if(o != null){
			JSONArray params = (JSONArray)o;
			for(int i=0; i<params.size(); i++){
				JSONObject p = (JSONObject)params.get(i);
				String col = p.getString("col");
				String tname = p.getString("tname");
				String type = p.getString("type");
				String val = p.getString("val");
				String val2 = p.getString("val2");
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
		return sb.toString();
	}
	
	public static class RSDataSource {
		private String  url;
		private String name;
		private String psd;
		private String linktype;
		private String jdniname;
		private String use; //jdbc/jndi
		private String type; //使用的什么数据库
		
		public String getType() {
			return type;
		}
		public void setType(String type) {
			this.type = type;
		}
		public String getUrl() {
			return url;
		}
		public String getName() {
			return name;
		}
		public String getPsd() {
			return psd;
		}
		public void setUrl(String url) {
			this.url = url;
		}
		public void setName(String name) {
			this.name = name;
		}
		public void setPsd(String psd) {
			this.psd = psd;
		}
		public String getLinktype() {
			return linktype;
		}
		public void setLinktype(String linktype) {
			this.linktype = linktype;
		}
		public String getJdniname() {
			return jdniname;
		}
		public void setJdniname(String jdniname) {
			this.jdniname = jdniname;
		}
		public String getUse() {
			return use;
		}
		public void setUse(String use) {
			this.use = use;
		}
	}
	
	public static class DSColumn {
		private String name;
		private String type;
		private String dispName;
		private String tname; //字段所属表
		private Boolean isshow; //是否显示字段
		public String getName() {
			return name;
		}
		public String getType() {
			return type;
		}
		public void setName(String name) {
			this.name = name;
		}
		public void setType(String type) {
			this.type = type;
		}
		public String getDispName() {
			return dispName;
		}
		public void setDispName(String dispName) {
			this.dispName = dispName;
		}
		public String getTname() {
			return tname;
		}
		public void setTname(String tname) {
			this.tname = tname;
		}
		public Boolean getIsshow() {
			return isshow;
		}
		public void setIsshow(Boolean isshow) {
			this.isshow = isshow;
		}
		
	}
}
