package com.ruisi.vdop.ser.division;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONObject;

import org.apache.commons.collections.map.CaseInsensitiveMap;
import org.apache.log4j.Logger;

import com.ruisi.ext.engine.util.PasswordEncrypt;
import com.ruisi.ext.engine.view.builder.dsource.DataSourceBuilder;
import com.ruisi.vdop.ser.utils.DataService;

/**
 * 查询线程
 * @author hq
 * @date 2017-4-18
 */
public class QueryThread extends Thread {
	
	private static Logger log = Logger.getLogger(QueryThread.class);
	
	private JSONObject dsourceJson;
	private String sql;
	private List<Map> datas;
	
	public QueryThread(JSONObject dsourceJson, String sql, List<Map> datas){
		this.dsourceJson = dsourceJson;
		this.sql = sql;
		this.datas = datas;
	}

	@Override
	public void run() {
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(dsourceJson);
		String use = rsds.getUse();
		Connection conn = null;
		PreparedStatement ps = null;
		ResultSet rs = null;
		try{
			log.info("sql : " + sql);
			if(use == null || "jdbc".equals(use)){
				conn = com.ruisi.vdop.ser.utils.DBUtils.getConnection(rsds.getUrl(), rsds.getName(), PasswordEncrypt.decode(rsds.getPsd()), rsds.getLinktype());
			}else{
				conn = com.ruisi.vdop.ser.utils.DBUtils.getConnection(rsds.getJdniname());
			}
			ps = conn.prepareStatement(sql);
			rs = ps.executeQuery();
			
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
				datas.add(m);
			}
		}catch(SQLException ex){
			log.error("sql :" + sql, ex);
		}finally{
			try {
				if(rs != null)rs.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
			try {
				if(ps != null)ps.close();
			} catch (SQLException e) {
				e.printStackTrace();
			}
			if(conn != null){
				try {
					conn.close();
				} catch (SQLException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}

}
