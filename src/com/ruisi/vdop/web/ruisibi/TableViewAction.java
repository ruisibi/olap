package com.ruisi.vdop.web.ruisibi;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.vdop.ser.ruisibi.TableService;
import com.ruisi.vdop.ser.utils.CompPreviewService;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 编辑时预览action
 * @author hq
 * @date 2013-11-21
 */
public class TableViewAction {
	
	private String tableJson;
	private String kpiJson;
	private String compId; //当前预览组件的ID
	private String params; //外部参数
	private String dsource;
	private String dset;
	private String cubeId;  //在缓存对象的时候使用
	private String cubeKpis; //立方体的所有指标，用在数据缓存的时候
	private String divison; //分表信息

	public String execute() throws Exception{
		
		ExtContext.getInstance().removeMV(TableService.deftMvId);
		
		JSONObject tablej = JSONObject.fromObject(tableJson);
		JSONArray kpij = JSONArray.fromObject(kpiJson);
		JSONArray parj = JSONArray.fromObject(params);
		JSONObject dsourcej = JSONObject.fromObject(dsource);
		JSONObject dsetj = JSONObject.fromObject(dset);
		JSONArray cacheKpi = JSONArray.fromObject(cubeKpis);
		JSONObject divisonj = JSONObject.fromObject(divison);
		
		//放入request,方便访问
		VDOPUtils.getRequest().setAttribute("tablej", tablej);
		VDOPUtils.getRequest().setAttribute("kpij", kpij);
		VDOPUtils.getRequest().setAttribute("compId", compId);
		
		TableService tser = new TableService();
		tser.setDset(dsetj);
		tser.setDsourceJson(dsourcej);
		tser.setTableJson(tablej);
		tser.setKpiJson(kpij);
		
		MVContext mv = tser.json2MV(divisonj, cacheKpi, parj,cubeId);
		
		CompPreviewService ser = new CompPreviewService();
		ser.setParams(tser.getMvParams());
		ser.initPreview();
		
		String ret = ser.buildMV(mv);
		
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(ret);
		
		return null;
	}
	
	
	
	public String getCubeId() {
		return cubeId;
	}



	public void setCubeId(String cubeId) {
		this.cubeId = cubeId;
	}



	public String getTableJson() {
		return tableJson;
	}

	public void setTableJson(String tableJson) {
		this.tableJson = tableJson;
	}

	public String getKpiJson() {
		return kpiJson;
	}

	public void setKpiJson(String kpiJson) {
		this.kpiJson = kpiJson;
	}

	public String getCompId() {
		return compId;
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

	public String getDsource() {
		return dsource;
	}

	public void setDsource(String dsource) {
		this.dsource = dsource;
	}

	public String getDset() {
		return dset;
	}

	public void setDset(String dset) {
		this.dset = dset;
	}



	public String getCubeKpis() {
		return cubeKpis;
	}



	public void setCubeKpis(String cubeKpis) {
		this.cubeKpis = cubeKpis;
	}



	public String getDivison() {
		return divison;
	}



	public void setDivison(String divison) {
		this.divison = divison;
	}

	
}
