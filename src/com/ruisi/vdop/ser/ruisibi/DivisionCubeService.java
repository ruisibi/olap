package com.ruisi.vdop.ser.ruisibi;

import java.sql.SQLException;

import com.ruisi.vdop.ser.utils.DataService;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

/**
 * 分表业务逻辑
 * @author hq
 * @date 2017-4-17
 */
public class DivisionCubeService extends AggreCubeService {
	
	private JSONObject division; //分表信息
	
	public DivisionCubeService(JSONObject cube, JSONObject dset, JSONObject dsource, JSONObject division){
		super(cube, dset, dsource);
		this.division = division;
	}
	
	public String proces() throws SQLException {
		StringBuffer sb = new StringBuffer();
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(dsource);
		int number = new Integer((String)division.get("number"));
		JSONArray tabs = division.getJSONArray("tabs");
		String col = division.getString("col");
		for(int i=0; i<number; i++){
			JSONObject tab = tabs.getJSONObject(i);
			String key =  col + " between " + tab.getString("st") + " and " + tab.getString("end");
			String tableSuffix = "_AR" + i;
			String sql = this.createsql(rsds, tableSuffix, key);
			sb.append(this.executesql(sql, tableSuffix, rsds));
		}
		return sb.toString();
	}
}
