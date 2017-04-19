package com.ruisi.vdop.web.detail;

import javax.servlet.http.HttpServletResponse;

import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.vdop.ser.detail.ChartService;
import com.ruisi.vdop.ser.utils.CompPreviewService;
import com.ruisi.vdop.util.VDOPUtils;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

public class ChartViewAction {
	
	public String kpiJson;
	private String chartJson;
	private String params; //图形参数
	private String dset;
	private String dsource;
	
	private static Object lock = new Object();
	
	public  String execute() throws Exception{
		synchronized(lock){
			ExtContext.getInstance().removeMV(ChartService.deftMvId);
	
			JSONObject chartj = JSONObject.fromObject(chartJson);
			JSONArray kpij = JSONArray.fromObject(kpiJson);
			JSONArray parj = JSONArray.fromObject(params);
			JSONObject dsourcej = JSONObject.fromObject(dsource);
			JSONObject dsetj = JSONObject.fromObject(dset);
			
			ChartService cs = new ChartService();
			MVContext mv = cs.json2MV(chartj, kpij, parj, dsetj, dsourcej);
			CompPreviewService vser = new CompPreviewService();
			vser.initPreview();
			String ret = vser.buildMV(mv);
			HttpServletResponse resp = VDOPUtils.getResponse();
			resp.setContentType("text/html; charset=UTF-8");
			resp.getWriter().print(ret);
		}
		
		return null;
	}



	public String getKpiJson() {
		return kpiJson;
	}

	public String getChartJson() {
		return chartJson;
	}

	public void setKpiJson(String kpiJson) {
		this.kpiJson = kpiJson;
	}

	public void setChartJson(String chartJson) {
		this.chartJson = chartJson;
	}


	public String getParams() {
		return params;
	}

	public void setParams(String params) {
		this.params = params;
	}

	public String getDset() {
		return dset;
	}

	public String getDsource() {
		return dsource;
	}

	public void setDset(String dset) {
		this.dset = dset;
	}

	public void setDsource(String dsource) {
		this.dsource = dsource;
	}

}
