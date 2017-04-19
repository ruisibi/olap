package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.dao.DaoHelper;
import com.ruisi.ext.engine.util.ContextUtils;
import com.ruisi.vdop.ser.utils.DBUtils;
import com.ruisi.vdop.ser.utils.DataService;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 维度筛选
 * @author hq
 * @date 2013-10-9
 */
public class DimFilterAction {
	
	private String dsource;
	private String dim;
	
	private String keyword;
	private String aggreTable; //聚集表 

	private Logger log = Logger.getLogger(DimFilterAction.class);
	
	public String execute() throws ParseException, IOException{
		JSONObject dimJson = JSONObject.fromObject(dim);
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(JSONObject.fromObject(dsource));
		StringBuffer sql = new StringBuffer();
		sql.append("select DISTINCT ");
		sql.append(dimJson.getString("tableColKey"));
		sql.append(",");
		sql.append(dimJson.getString("tableColName"));
		sql.append(" from ");
		sql.append(dimJson.getString("tableName"));
		if(keyword != null && keyword.length() > 0){
			sql.append(" where ");
			sql.append(dimJson.getString("tableColName"));
			sql.append(" like '%"+keyword+"%'");
		}
		//默认按key 排序
		sql.append(" order by " + dimJson.getString("tableColKey"));
		//log.info(sql);
		List ls = DBUtils.queryDims(rsds, sql.toString(), false);
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(JSONArray.fromObject(ls).toString());
		return null;
	}
	
	/**
	 * 列出维度的值，从表里查数据,只取top50
	 * @return
	 * @throws ParseException
	 * @throws IOException
	 */
	public String listVals() throws ParseException, IOException{
		JSONObject dimJson = JSONObject.fromObject(dim);
		String tname = dimJson.getString("tname");
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(JSONObject.fromObject(dsource));
		StringBuffer sql = new StringBuffer();
		sql.append("select DISTINCT ");
		sql.append(dimJson.getString("colname"));
		sql.append(",'' pppp ");
		sql.append(" from ");
		if(aggreTable == null || aggreTable.length() == 0){
			sql.append(tname);
		}else{
			if(aggreTable.equalsIgnoreCase(tname+"_ar")){
				sql.append(this.aggreTable);
			}else{
				sql.append(tname);
			}
		}
		sql.append(" a0 ");
		if(keyword != null && keyword.length() > 0){
			sql.append(" where ");
			sql.append(dimJson.getString("colname"));
			sql.append(" like '%"+keyword+"%'");
		}
		sql.append(" order by " + dimJson.getString("colname"));
		//System.out.println(sql);
		List ls = DBUtils.queryDims(rsds, sql.toString(), true);
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(JSONArray.fromObject(ls).toString());
		return null;
	}

	public String getDsource() {
		return dsource;
	}

	public String getDim() {
		return dim;
	}

	public void setDim(String dim) {
		this.dim = dim;
	}

	public void setDsource(String dsource) {
		this.dsource = dsource;
	}

	public String getKeyword() {
		return keyword;
	}

	public void setKeyword(String keyword) {
		this.keyword = keyword;
	}
	
	public String getAggreTable() {
		return aggreTable;
	}

	public void setAggreTable(String aggreTable) {
		this.aggreTable = aggreTable;
	}
}
