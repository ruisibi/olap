package com.ruisi.vdop.ser.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.sql.DataSource;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.apache.commons.collections.map.CaseInsensitiveMap;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.ruisi.ext.engine.ConstantsEngine;
import com.ruisi.ext.engine.ExtConstants;
import com.ruisi.ext.engine.util.PasswordEncrypt;
import com.ruisi.ext.engine.view.builder.dsource.DataSourceBuilder;


public class DBUtils {
	
	private static Log log = LogFactory.getLog(DBUtils.class);
	
	public static boolean testConnection(String url, String name, String psd, String clazz) {
		boolean ret = false;
		Connection conn = null;
		try {
			Class.forName(clazz).newInstance();
			conn= DriverManager.getConnection(url,name, psd);
			if(conn != null){
				ret = true;
			}else{
				ret = false;
			}
		} catch (Exception e) {
			e.printStackTrace();
			ret = false;;
		}finally{
			closeConnection(conn);
		}
		return ret;
	}
	
	public static boolean testJndi(String jndiname){
		boolean ret = false;
		Connection con = null;
		try{
		  	Context ctx = new InitialContext();      
		    String strLookup = "java:comp/env/"+jndiname; 
		    DataSource ds =(DataSource) ctx.lookup(strLookup);
		    con = ds.getConnection();
		    if (con != null){
		       ret = true;
		    }else{
		    	ret = false;
		    }
		}catch (Exception e) {
			e.printStackTrace();
			ret = false;
		}finally{
			closeConnection(con);
		}
		return ret;
	}
	
	public static void closeConnection(Connection conn){
		if(conn != null){
			try {
				conn.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
	}
	
	public static Connection getConnection(String url, String name, String psd, String clazz){
		try {
			Class.forName(clazz).newInstance();
			Connection conn= DriverManager.getConnection(url,name, psd);
			return conn;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	public static Connection getConnection(String jndiname){
		Connection con = null;
		try {
			Context ctx = new InitialContext();      
		    String strLookup = "java:comp/env/"+jndiname; 
		    DataSource ds =(DataSource) ctx.lookup(strLookup);
		    con = ds.getConnection();
		}catch(Exception ex){
			ex.printStackTrace();
		}
	    return con;
	}
	
	/**
	 * 根据sql生成数据集的字段信息
	 * @param sql
	 * @param rsds
	 * @return
	 */
	public static List<DataService.DSColumn> queryMeta(String sql, DataService.RSDataSource rsds){
		Connection conn  = null;
		try {
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = getConnection(rsds.getJdniname());
			}
			PreparedStatement ps = conn.prepareStatement(sql);
			ResultSet rs = ps.executeQuery();
			
			ResultSetMetaData meta = rs.getMetaData();
			List<DataService.DSColumn> cols = new ArrayList<DataService.DSColumn>();
			for(int i=0; i<meta.getColumnCount(); i++){
				String name = meta.getColumnName(i+1);
				String tp = meta.getColumnTypeName(i+1);
				//tp转换
				tp = tp.replaceAll(" UNSIGNED", ""); //mysql 存在 UNSIGNED 类型, 比如： INT UNSIGNED
				if("varchar".equalsIgnoreCase(tp) || "varchar2".equalsIgnoreCase(tp) || "nvarchar".equalsIgnoreCase(tp) || "char".equalsIgnoreCase(tp)){
					tp = "String";
				}else if("int".equalsIgnoreCase(tp) || "MEDIUMINT".equalsIgnoreCase(tp) || "BIGINT".equalsIgnoreCase(tp) || "smallint".equalsIgnoreCase(tp) || "TINYINT".equalsIgnoreCase(tp)){
					tp = "Int";
				}else if("number".equalsIgnoreCase(tp) || "DECIMAL".equalsIgnoreCase(tp) || "Float".equalsIgnoreCase(tp) || "Double".equalsIgnoreCase(tp)){
					tp = "Double";
				}else if("DATETIME".equalsIgnoreCase(tp) || "DATE".equalsIgnoreCase(tp) || "Timestamp".equalsIgnoreCase(tp)){
					tp = "Date";
				}
				DataService.DSColumn col = new DataService.DSColumn();
				col.setName(name);
				col.setType(tp);
				col.setIsshow(true);
				cols.add(col);
			}
			rs.close();
			ps.close();
			return cols;
		} catch (SQLException e) {
			e.printStackTrace();
			throw new RuntimeException("sql 执行报错.");
		}finally{
			closeConnection(conn);
		}
	}
	
	/***
	 * 查询数据集的列字段，同时知道列字段是从哪个表里来的
	 * @param sql
	 * @param rsds
	 * @return
	 */
	public static List<DataService.DSColumn> queryMetaAndIncome(JSONObject dataset, DataService.RSDataSource rsds){
		List<String> tables = new ArrayList<String>();
		//需要进行关联的表
		JSONArray joinTabs = dataset.getJSONArray("joininfo");
		//生成sql
		StringBuffer sb = new StringBuffer("select a0.* ");
		//添加 列的分隔符，方便识别列是从哪个表来
		if(joinTabs.size() != 0){ //无关联表，不需要该字段
			sb.append(",'' a$idx ");
		}
		for(int i=0; i<joinTabs.size(); i++){
			sb.append(", a"+(i+1)+".* ");
			if(i != joinTabs.size() - 1){
				//添加 列的分隔符，方便识别列是从哪个表来
				sb.append(",'' a$idx");
			}
		}
		sb.append("from ");
		sb.append(dataset.getString("master") + " a0 ");
		tables.add(dataset.getString("master"));
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			sb.append(", "+tab.getString("ref")+" a"+(i+1)+" ");
			tables.add(tab.getString("ref"));
		}
		sb.append("where 1=2 ");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			sb.append("and a0."+tab.getString("col")+"=a"+(i+1)+"."+tab.getString("refKey"));
			sb.append(" ");
		}
		
		Connection conn  = null;
		try {
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = getConnection(rsds.getJdniname());
			}
			PreparedStatement ps = conn.prepareStatement(sb.toString());
			ResultSet rs = ps.executeQuery();
			
			ResultSetMetaData meta = rs.getMetaData();
			List<DataService.DSColumn> cols = new ArrayList<DataService.DSColumn>();
			String tname = tables.get(0);
			int idx = 1;
			for(int i=0; i<meta.getColumnCount(); i++){
				String name = meta.getColumnName(i+1);
				//遇到a$idx 表示字段做分割, 需要变换字段所属表信息
				if("a$idx".equalsIgnoreCase(name)){
					tname = tables.get(idx);
					idx++;
					continue;
				}
				String tp = meta.getColumnTypeName(i+1);
				//tp转换
				tp = tp.replaceAll(" UNSIGNED", ""); //mysql 存在 UNSIGNED 类型, 比如： INT UNSIGNED
				if("varchar".equalsIgnoreCase(tp) || "varchar2".equalsIgnoreCase(tp) || "nvarchar".equalsIgnoreCase(tp) || "char".equalsIgnoreCase(tp)){
					tp = "String";
				}else if("int".equalsIgnoreCase(tp) || "MEDIUMINT".equalsIgnoreCase(tp) || "BIGINT".equalsIgnoreCase(tp) || "smallint".equalsIgnoreCase(tp) || "TINYINT".equalsIgnoreCase(tp)){
					tp = "Int";
				}else if("number".equalsIgnoreCase(tp) || "DECIMAL".equalsIgnoreCase(tp) || "Float".equalsIgnoreCase(tp) || "Double".equalsIgnoreCase(tp)){
					tp = "Double";
				}else if("DATETIME".equalsIgnoreCase(tp) || "DATE".equalsIgnoreCase(tp) || "Timestamp".equalsIgnoreCase(tp)){
					tp = "Date";
				}
				DataService.DSColumn col = new DataService.DSColumn();
				col.setName(name);
				col.setType(tp);
				col.setTname(tname);
				col.setIsshow(true);
				cols.add(col);
			}
			rs.close();
			ps.close();
			return cols;
		} catch (SQLException e) {
			e.printStackTrace();
			throw new RuntimeException("sql 执行报错.");
		}finally{
			closeConnection(conn);
		}
	}
	
	
	/**
	 * 只取前100行数据
	 * @param rsds
	 * @param sql
	 * @param dealNull 如果是true 表示 id 为NULL 设置为未知
	 * @return
	 */
	public static List<Map> queryDims(DataService.RSDataSource rsds, String sql, boolean dealNull){
		//替换@
		sql = sql.replaceAll("@", "'");
		Connection conn  = null;
		try {
			List<Map> ret = new ArrayList<Map>();
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = getConnection(rsds.getJdniname());
			}
			PreparedStatement ps = conn.prepareStatement(sql);
			ResultSet rs = ps.executeQuery();
			int idx = 0;
			while(rs.next()){
				if(idx >= 100){
					break;
				}
				Map m = new HashMap();
				String id = rs.getString(1);
				String text = rs.getString(2);
				if(text == null || text.length() == 0){
					text = id;
				}
				m.put("id", id == null ? ExtConstants.NULLVAL:id);
				m.put("text", text == null ? ExtConstants.NULLVALTXT : text);
				ret.add(m);
				idx++;
			}
			rs.close();
			ps.close();
			return ret;
		} catch (SQLException e) {
			e.printStackTrace();
		}finally{
			closeConnection(conn);
		}
		return null;
	}
	
	public static List<Map> queryViews(DataService.RSDataSource rsds){
		Connection conn  = null;
		try {
			List<Map> ret = new ArrayList<Map>();
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = getConnection(rsds.getJdniname());
			}
			//System.out.println(conn.getCatalog());
			String qsql = null;
			if("mysql".equals(rsds.getType())){
				qsql = ConstantsEngine.replace(DataService.showViews_mysql, conn.getCatalog());
			}else if("oracle".equals(rsds.getType())){
				qsql = DataService.showViews_oracle;
			}else if("sqlserver".equals(rsds.getType())){
				qsql = DataService.showViews_sqlser;
			}
			PreparedStatement ps = conn.prepareStatement(qsql);
			ResultSet rs = ps.executeQuery();
	
			while(rs.next()){
				String tname = rs.getString(1);
				Map m = new HashMap();
				m.put("id", tname);
				m.put("text", tname);
				m.put("iconCls", "icon-view");
				ret.add(m);
			}
			rs.close();
			ps.close();
			return ret;
		} catch (SQLException e) {
			e.printStackTrace();
		}finally{
			closeConnection(conn);
		}
		return null;
	}
	
	public static List<Map> queryTables(DataService.RSDataSource rsds){
		Connection conn  = null;
		try {
			List<Map> ret = new ArrayList<Map>();
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = getConnection(rsds.getJdniname());
			}
			//System.out.println(conn.getCatalog());
			String qsql = null;
			if("mysql".equals(rsds.getType())){
				qsql = ConstantsEngine.replace(DataService.showTables_mysql, conn.getCatalog());
			}else if("oracle".equals(rsds.getType())){
				qsql = DataService.showTables_oracle;
			}else if("sqlserver".equals(rsds.getType())){
				qsql = DataService.showTables_sqlser;
			}
			PreparedStatement ps = conn.prepareStatement(qsql);
			ResultSet rs = ps.executeQuery();
	
			while(rs.next()){
				String tname = rs.getString(1);
				Map m = new HashMap();
				m.put("id", tname);
				m.put("text", tname);
				m.put("iconCls", "icon-table");
				ret.add(m);
			}
			rs.close();
			ps.close();
			return ret;
		} catch (SQLException e) {
			e.printStackTrace();
		}finally{
			closeConnection(conn);
		}
		return null;
	}
	
	public static List querySql(String sql, DataService.RSDataSource rsds){
		log.info(sql);
		Connection conn  = null;
		try {
			List ret = new ArrayList();
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = getConnection(rsds.getJdniname());
			}
			PreparedStatement ps = conn.prepareStatement(sql);
			ResultSet rs = ps.executeQuery();
			
			int c = rs.getMetaData().getColumnCount();
			String[] cols = new String[c];
			for(int i=1; i<=c; i++){
				cols[i-1] =rs.getMetaData().getColumnName(i);
			}
			while(rs.next()){
				CaseInsensitiveMap m = new CaseInsensitiveMap();
				for(int i=1; i<=cols.length; i++){
					String col = cols[i-1];
					m.put(col, DataSourceBuilder.getResultSetValue(rs, i));
				}
				ret.add(m);
			}
			
			rs.close();
			ps.close();
			return ret;
		} catch (SQLException e) {
			e.printStackTrace();
		}finally{
			closeConnection(conn);
		}
		return null;
	}
	
	public static List querySql(String sql, Connection conn) throws SQLException{
		PreparedStatement ps = null;
		try {
			List ret = new ArrayList();
			ps = conn.prepareStatement(sql);
			ResultSet rs = ps.executeQuery();
			
			int c = rs.getMetaData().getColumnCount();
			String[] cols = new String[c];
			for(int i=1; i<=c; i++){
				cols[i-1] =rs.getMetaData().getColumnName(i);
			}
			while(rs.next()){
				CaseInsensitiveMap m = new CaseInsensitiveMap();
				for(int i=1; i<=cols.length; i++){
					String col = cols[i-1];
					m.put(col, DataSourceBuilder.getResultSetValue(rs, i));
				}
				ret.add(m);
			}
			
			rs.close();
			return ret;
		} catch (SQLException e) {
			throw e;
		}finally{
			if(ps != null){
				try {
					ps.close();
				} catch (SQLException e) {
					e.printStackTrace();
				}
			}
		}
	}
	
	public static List queryTop100(String sql, DataService.RSDataSource rsds){
		Connection conn  = null;
		try {
			List ret = new ArrayList();
			String use = rsds.getUse();
			if(use == null || "jdbc".equals(use)){
				conn = getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = getConnection(rsds.getJdniname());
			}
			PreparedStatement ps = conn.prepareStatement(sql);
			ResultSet rs = ps.executeQuery();
			
			ResultSetMetaData meta = rs.getMetaData();
			List<String> cols = new ArrayList<String>();
			for(int i=0; i<meta.getColumnCount(); i++){
				String name = meta.getColumnName(i+1);
				cols.add(name);
			}
			ret.add(cols);
			int idx = 0;
			while(rs.next() && idx <= 100){
				Map<String, Object> m = new HashMap<String, Object>();
				for(String s : cols){
					m.put(s, rs.getString(s));
				}
				ret.add(m);
				idx++;
			}
			rs.close();
			ps.close();
			return ret;
		} catch (SQLException e) {
			e.printStackTrace();
		}finally{
			closeConnection(conn);
		}
		return null;
	}
}
