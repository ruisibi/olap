package com.ruisi.vdop.web.detail;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.vdop.ser.detail.GridService;
import com.ruisi.vdop.ser.ruisibi.TableService;
import com.ruisi.vdop.ser.utils.CompPreviewService;
import com.ruisi.vdop.util.VDOPUtils;

public class GridViewAction {
	
	private String gridJson;
	private String dset;
	private String dsource;
	private String params;
	
	public String execute() throws Exception{
		ExtContext.getInstance().removeMV(GridService.deftMvId);
		
		GridService ser = new GridService();
		JSONObject oGirdJson = JSONObject.fromObject(gridJson);
		JSONArray oParams = JSONArray.fromObject(params);
		JSONObject oDset = JSONObject.fromObject(dset);
		JSONObject oDsource = JSONObject.fromObject(dsource);
		MVContext mv = ser.json2MV(oGirdJson, oParams, oDset, oDsource, false);
		
		CompPreviewService vser = new CompPreviewService();
		//ser.setParams(tser.getMvParams());
		vser.initPreview();
		String ret = vser.buildMV(mv);
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(ret);
		
		return null;
	}
	
	
	public String getParams() {
		return params;
	}
	
	public void setParams(String params) {
		this.params = params;
	}


	public String getGridJson() {
		return gridJson;
	}


	public String getDset() {
		return dset;
	}


	public String getDsource() {
		return dsource;
	}


	public void setGridJson(String gridJson) {
		this.gridJson = gridJson;
	}


	public void setDset(String dset) {
		this.dset = dset;
	}


	public void setDsource(String dsource) {
		this.dsource = dsource;
	}
	
	
}
