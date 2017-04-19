package com.ruisi.vdop.web.ruisibi;

import javax.servlet.http.HttpServletResponse;

import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.vdop.ser.ruisibi.ChartService;
import com.ruisi.vdop.ser.utils.CompPreviewService;
import com.ruisi.vdop.util.VDOPUtils;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

public class ChartViewAction {
	
	public String kpiJson;
	private String chartJson;
	private String compId; //组件的ID
	private String params; //图形参数
	private String dset;
	private String dsource;
	private String cubeId;  //在缓存对象的时候使用
	private String cubeKpis; //立方体的所有指标，用在数据缓存的时候
	private String divison; //分表信息
	
	private static Object lock = new Object();
	
	public  String execute() throws Exception{
		synchronized(lock){
			ExtContext.getInstance().removeMV(ChartService.deftMvId);
	
			JSONObject chartj = JSONObject.fromObject(chartJson);
			JSONArray kpij = JSONArray.fromObject(kpiJson);
			JSONArray parj = JSONArray.fromObject(params);
			JSONObject dsourcej = JSONObject.fromObject(dsource);
			JSONObject dsetj = JSONObject.fromObject(dset);
			JSONObject divisonj = JSONObject.fromObject(divison);
			
			ChartService cs = new ChartService();
			cs.setChartJson(chartj);
			cs.setKpiJson(kpij);
			cs.setDsourceJson(dsourcej);
			cs.setDsetJson(dsetj);
			
			MVContext mv = cs.json2MV(compId, cubeId, parj, divisonj);
			
			//放入request方便访问
			VDOPUtils.getRequest().setAttribute("compId", compId);
			VDOPUtils.getRequest().setAttribute("xcolid", cs.getXcolId());
			
			CompPreviewService ser = new CompPreviewService();
			ser.setParams(cs.getMvParams());
			ser.initPreview();
			
			String ret = ser.buildMV(mv);
			
			HttpServletResponse resp = VDOPUtils.getResponse();
			resp.setContentType("text/html; charset=UTF-8");
			resp.getWriter().print(ret);
		}
		
		return null;
	}
	
	

	public String getCubeId() {
		return cubeId;
	}



	public String getCubeKpis() {
		return cubeKpis;
	}



	public void setCubeId(String cubeId) {
		this.cubeId = cubeId;
	}



	public void setCubeKpis(String cubeKpis) {
		this.cubeKpis = cubeKpis;
	}



	public String getKpiJson() {
		return kpiJson;
	}

	public String getChartJson() {
		return chartJson;
	}

	public String getCompId() {
		return compId;
	}
	
	public void setKpiJson(String kpiJson) {
		this.kpiJson = kpiJson;
	}

	public void setChartJson(String chartJson) {
		this.chartJson = chartJson;
	}

	public void setCompId(String compId) {
		this.compId = compId;
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



	public String getDivison() {
		return divison;
	}



	public void setDivison(String divison) {
		this.divison = divison;
	}

}
