package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.vdop.ser.utils.DBUtils;
import com.ruisi.vdop.ser.utils.DataService;
import com.ruisi.vdop.util.VDOPUtils;

public class DataSetAction {
	
	private String datasetname;
	private String querysql;
	private String ds; //datasource的JSON
	private String dataset; //datasetjson
	private String datsetid;
	private String params; //页面参数的json
	
	/**
	 * 列出数据库的表
	 * @return
	 * @throws Exception
	 */
	public String queryTables() throws Exception {
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(JSONObject.fromObject(ds));
		List<Map> ls = DBUtils.queryTables(rsds);
		ls.addAll(DBUtils.queryViews(rsds)); //追加视图
		String ret = JSONArray.fromObject(ls).toString();
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/xml; charset=UTF-8");
		resp.getWriter().println(ret);
		return null;
	}
	
	public String queryData() throws Exception {
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(JSONObject.fromObject(ds));
		JSONObject obj = JSONObject.fromObject(dataset);
		String sql = ser.createDatasetSql(obj);
		//JSONArray ps = JSONArray.fromObject(this.params);
		//sql = DBUtils.evaluateSql(sql, ps);
		List ls = DBUtils.queryTop100(sql, rsds);
		VDOPUtils.getRequest().setAttribute("ls", ls);
		return "queryData";
	}
	
	public String queryMeta() throws IOException{
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(JSONObject.fromObject(ds));
		List<DataService.DSColumn> ls = DBUtils.queryMeta(querysql, rsds);
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/xml; charset=UTF-8");
		String ctx = JSONArray.fromObject(ls).toString();
		resp.getWriter().println(ctx);
		return null;
	}
	
	public String queryDatasetMeta() throws IOException{
		DataService ser = new DataService();
		DataService.RSDataSource rsds = ser.json2datasource(JSONObject.fromObject(ds));
		List<DataService.DSColumn> ls = DBUtils.queryMetaAndIncome(JSONObject.fromObject(this.dataset), rsds);
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/xml; charset=UTF-8");
		String ctx = JSONArray.fromObject(ls).toString();
		resp.getWriter().println(ctx);
		return null;
	}

	public String getDatasetname() {
		return datasetname;
	}

	public String getQuerysql() {
		return querysql;
	}

	public void setDatasetname(String datasetname) {
		this.datasetname = datasetname;
	}

	public void setQuerysql(String querysql) {
		this.querysql = querysql;
	}

	public String getDs() {
		return ds;
	}

	public void setDs(String ds) {
		this.ds = ds;
	}

	public String getDatsetid() {
		return datsetid;
	}

	public void setDatsetid(String datsetid) {
		this.datsetid = datsetid;
	}

	public String getDataset() {
		return dataset;
	}

	public void setDataset(String dataset) {
		this.dataset = dataset;
	}

	public String getParams() {
		return params;
	}

	public void setParams(String params) {
		this.params = params;
	}
}
