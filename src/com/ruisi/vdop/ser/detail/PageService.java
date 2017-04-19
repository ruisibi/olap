package com.ruisi.vdop.ser.detail;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.ExtConstants;
import com.ruisi.ext.engine.init.TemplateManager;
import com.ruisi.ext.engine.util.IdCreater;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.ext.engine.view.context.MVContextImpl;
import com.ruisi.ext.engine.view.context.chart.ChartContext;
import com.ruisi.ext.engine.view.context.gridreport.GridReportContext;

public class PageService {
	
	public final static String deftMvId = "mv.page.export";
	
	private GridService gser = new GridService();
	private ChartService cser = new ChartService();
	
	public MVContext json2MV(JSONObject page) throws Exception{
		JSONObject grid = findGrid(page);
		JSONObject dset = findDset(page, grid.getString("datasetid"));
		JSONObject dsource = this.findDsource(page, dset.getString("dsid"));
		
		//创建MV
		MVContext mv = new MVContextImpl();
		mv.setChildren(new ArrayList());
		String formId = ExtConstants.formIdPrefix + IdCreater.create();
		mv.setFormId(formId);
		mv.setMvid(PageService.deftMvId);
		
		GridReportContext gridC = this.json2Grid(grid, findParams(page), dset, dsource, true);
		
		mv.getChildren().add(gridC);
		gridC.setParent(mv);
		
		Map<String, GridReportContext> crs = new HashMap<String, GridReportContext>();
		crs.put(gridC.getId(), gridC);
		mv.setGridReports(crs);
		
		JSONObject chart = this.findChart(page);
		if(chart != null){
			JSONObject chartj = chart.getJSONObject("chartJson");
			JSONArray kpij = (JSONArray)chart.get("kpiJson");
			if(kpij != null && kpij.size() > 0){
				JSONObject cdset = findDset(page, chart.getString("datasetid"));
				JSONObject cdsource = this.findDsource(page, dset.getString("dsid"));
				ChartContext chartC = this.json2Chart(chartj, kpij, findParams(page), cdset, cdsource);
				mv.getChildren().add(chartC);
				chartC.setParent(mv);	
			}
		}
		GridService.createDsource(dsource, mv);
		return mv;
	}
	
	public GridReportContext json2Grid(JSONObject gridJson, JSONArray params, JSONObject dset, JSONObject dsourceJson, boolean export) throws Exception{
		//创建corssReport
		GridReportContext cr = gser.json2Grid(gridJson, export);
		//设置ID
		String id = ExtConstants.reportIdPrefix + IdCreater.create();
		cr.setId(id);
		
		//创建数据sql
		String sql = gser.createSql(gridJson, params, dset);
		String name = TemplateManager.getInstance().createTemplate(sql);
		cr.setTemplateName(name);
		cr.setRefDsource( dsourceJson.getString("dsid"));  //使用定义的数据源
		
		/**
		mv.getChildren().add(cr);
		cr.setParent(mv);
		
		Map<String, GridReportContext> crs = new HashMap<String, GridReportContext>();
		crs.put(cr.getId(), cr);
		mv.setGridReports(crs);
		**/
		return cr;
	}
	
	public ChartContext json2Chart(JSONObject chartj, JSONArray kpij, JSONArray params, JSONObject dset, JSONObject dsourceJson) throws Exception{
		ChartContext cr = cser.json2Chart(chartj, kpij);
		//设置ID
		String id = ExtConstants.reportIdPrefix + IdCreater.create();
		cr.setId(id);
		
		//创建数据sql
		String sql = cser.createSql(chartj, kpij, params, dset);
		String name = TemplateManager.getInstance().createTemplate(sql);
		cr.setTemplateName(name);
		cr.setRefDsource( dsourceJson.getString("dsid"));  //使用定义的数据源
		return cr;
	}
	
	public JSONObject findGrid(JSONObject page){
		return page.getJSONObject("grid");
	}
	
	public JSONObject findChart(JSONObject page){
		return (JSONObject)page.get("chart");
	}
	
	public JSONArray findParams(JSONObject page){
		return page.getJSONArray("params");
	}
	
	public JSONObject findDset(JSONObject page, String dsetId){
		JSONObject ret = null;
		JSONArray dss = page.getJSONArray("dataset");
		for(int i=0; i<dss.size(); i++){
			JSONObject ds = dss.getJSONObject(i);
			String datasetid = ds.getString("datasetid");
			if(datasetid.equals(dsetId)){
				ret = ds;
				break;
			}
		}
		return ret;
	}
	
	public JSONObject findDsource(JSONObject page, String ndsid){
		JSONObject ret = null;
		JSONArray dss = page.getJSONArray("datasource");
		for(int i=0; i<dss.size(); i++){
			JSONObject ds = dss.getJSONObject(i);
			String dsid = ds.getString("dsid");
			if(dsid.equals(ndsid)){
				ret = ds;
				break;
			}
		}
		return ret;
	}

}
