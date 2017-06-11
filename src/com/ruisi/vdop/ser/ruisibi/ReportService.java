package com.ruisi.vdop.ser.ruisibi;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.ExtConstants;
import com.ruisi.ext.engine.util.IdCreater;
import com.ruisi.ext.engine.view.context.Element;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.ext.engine.view.context.MVContextImpl;
import com.ruisi.ext.engine.view.context.chart.ChartContext;
import com.ruisi.ext.engine.view.context.cross.CrossReportContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridDataCenterContext;
import com.ruisi.ext.engine.view.context.dsource.DataSourceContext;
import com.ruisi.ext.engine.view.context.form.TextFieldContext;
import com.ruisi.ext.engine.view.context.gridreport.GridReportContext;
import com.ruisi.ext.engine.view.context.html.DataContext;
import com.ruisi.ext.engine.view.context.html.DivContext;
import com.ruisi.ext.engine.view.context.html.TextContext;
import com.ruisi.ext.engine.view.context.html.TextContextImpl;
import com.ruisi.ext.engine.view.context.html.table.TableContext;
import com.ruisi.ext.engine.view.context.html.table.TdContext;
import com.ruisi.ext.engine.view.context.html.table.TrContext;
import com.ruisi.vdop.util.VDOPUtils;

public class ReportService {
	
	public final static String deftMvId = "mv.export.tmp";
	private TableService tableSer = new TableService();
	private ChartService ser = new ChartService();
	ReportXMLService xmlSer = new ReportXMLService();
	
	public void createText(MVContext mv, String txt){
		TextContext text = new TextContextImpl();
		text.setText(txt);
		text.setParent(mv);
		mv.getChildren().add(text);
	}
	
	public void createTable(MVContext mv, JSONObject tableJson, JSONArray kpiJson,JSONArray params, JSONObject dset, JSONObject dsource, JSONObject cube) throws Exception{
		//先获取需要关联的表及表别名字段
		tableSer.setDset(dset);
		tableSer.setDsourceJson(dsource);
		tableSer.setKpiJson(kpiJson);
		tableSer.setTableJson(tableJson);
		JSONArray joinTabs = dset.getJSONArray("joininfo");
		tableSer.getTableAlias().clear();
		String aggreTable = (String)cube.get("aggreTable");
		
		if(aggreTable != null && aggreTable.length() > 0){
			dset.put("aggreTable", aggreTable);
		}
		tableSer.getTableAlias().put(dset.getString("master"), "a0");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			tableSer.getTableAlias().put(tab.getString("ref"), "a" + (i+1));
		}
		CrossReportContext cr = tableSer.json2Table();
		String id = ExtConstants.reportIdPrefix + IdCreater.create();
		cr.setId(id);
		cr.setOut("html");
		cr.setShowData(true);
		
		//创建数据中心
		String sql = tableSer.createSql(null, params );
		Object cache = cube.get("cache");
		String cubeId = null;   //其中cacheId 用来表示立方体是否缓存
		if(cache != null && "true".equals(cache.toString())){
			cubeId = cube.getString("id");
		}
		GridDataCenterContext dc = tableSer.createDataCenter( kpiJson, sql, params, cubeId, dset.getString("master"));
		cr.setRefDataCetner(dc.getId());
		if(mv.getGridDataCenters() == null){
			mv.setGridDataCenters(new HashMap<String, GridDataCenterContext>());
		}
		mv.getGridDataCenters().put(dc.getId(), dc);
		
		mv.getChildren().add(cr);
		cr.setParent(mv);
		
		cr.setRefDsource(dset.getString("dsid"));
		
		Map crs = new HashMap();
		crs.put(cr.getId(), cr);
		mv.setCrossReports(crs);
	}
	
	public void createChart(MVContext mv, JSONObject chartJson, JSONArray kpiJson, JSONArray params, JSONObject dset, JSONObject dsource, JSONObject cube) throws Exception{
		//先获取需要关联的表及表别名字段
		ser.setChartJson(chartJson);
		ser.setKpiJson(kpiJson);
		ser.setDsetJson(dset);
		ser.setDsourceJson(dsource);
		ser.getTableAlias().clear();
		JSONArray joinTabs = dset.getJSONArray("joininfo");
		String aggreTable = (String)cube.get("aggreTable");
		ser.getTableAlias().put(dset.getString("master"), "a0");
		if(aggreTable != null && aggreTable.length() > 0){
			dset.put("aggreTable", aggreTable);
		}
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			ser.getTableAlias().put(tab.getString("ref"), "a" + (i+1));
		}
		ChartContext cr = ser.json2Chart();
		String sql = ser.createSql(params);
		GridDataCenterContext dc = ser.createDataCenter(sql, params, cube.getString("id"), dset.getString("master"));
		cr.setRefDataCenter(dc.getId());
		if(mv.getGridDataCenters() == null){
			mv.setGridDataCenters(new HashMap<String, GridDataCenterContext>());
		}
		mv.getGridDataCenters().put(dc.getId(), dc);
		
		mv.getChildren().add(cr);
		cr.setParent(mv);
		
		Map crs = new HashMap();
		crs.put(cr.getId(), cr);
		mv.setCharts(crs);
	}
	
	public String getFilePath(ServletContext ctx){
		String path = "";
		path = ctx.getRealPath("/") + VDOPUtils.getConstant(ExtConstants.xmlResource);
		return path;
	}
	
	/**
	 * 睿思报表 mv 生成 xml
	 * @param mv
	 * @return
	 * @throws IOException 
	 */
	public String mv2XML2(MVContext mv) throws IOException{
		StringBuffer sb = new StringBuffer("<?xml version=\"1.0\" encoding=\"UTF-8\"?><ext-config>");
		List<Element> children = mv.getChildren();
		for(int i=0; i<children.size(); i++){
			Element comp = children.get(i);
			if(comp instanceof TableContext){
				TableContext table = (TableContext)comp;
				sb.append("<table>");
				List<Element> trs = table.getChildren();
				for(int j=0; j<trs.size(); j++){
					sb.append("<tr>");
					TrContext tr = (TrContext)trs.get(j);
					List<Element> tds = tr.getChildren();
					for(int k=0; k<tds.size(); k++){
						TdContext td = (TdContext)tds.get(k);
						sb.append("<td colspan=\""+td.getColspan()+"\" width=\""+td.getWidth()+"\">");
						
						List<Element> tdcld = td.getChildren();
						for(int l=0; l<tdcld.size(); l++){
							Element tdcldo = tdcld.get(l);
							if(tdcldo instanceof TextContext){
								xmlSer.createText(sb, (TextContext)tdcldo);
							}else if(tdcldo instanceof CrossReportContext){
								xmlSer.createCrossReport(sb, (CrossReportContext)tdcldo);
							}else if(tdcldo instanceof ChartContext){
								xmlSer.createChart(sb, (ChartContext)tdcldo);
							}else if(tdcldo instanceof GridReportContext){
								xmlSer.createGridReport(sb, (GridReportContext)tdcldo);
							}else if(tdcldo instanceof DivContext){
								xmlSer.createDiv(sb, (DivContext)tdcldo);
							}
							//对每个组件之间启用换行
							/**
							if(l != tdcld.size() - 1){
								sb.append("<br/>");
							}
							**/
						}
						
						sb.append("</td>");
					}
					sb.append("</tr>");
				}
				sb.append("</table>");
			}else if(comp instanceof TextFieldContext){
				TextFieldContext input = (TextFieldContext)comp;
				sb.append("<textField type=\"hidden\" id=\""+input.getId()+"\"");
				if(input.getDefaultValue() != null){
					sb.append(" defaultValue=\""+input.getDefaultValue()+"\"");
				}
				sb.append("/>");
			}else if(comp instanceof DataContext){
				DataContext data = (DataContext)comp;
				xmlSer.createData(sb, data);
			}
		}
		//生成dataCenter
		Map<String, GridDataCenterContext> dcs = mv.getGridDataCenters();
		xmlSer.createDataCenter(sb, dcs);
		
		//生成dataSource
		Map<String, DataSourceContext> dsources = mv.getDsources();
		xmlSer.createDataSource(sb, dsources);
		sb.append("</ext-config>");
		return sb.toString();
	}
	
	/**
	 * 多维分析mv 生成 xml
	 * @param mv
	 * @return
	 * @throws IOException
	 */
	public String mv2XML(MVContext mv) throws IOException{
		StringBuffer sb = new StringBuffer("<?xml version=\"1.0\" encoding=\"UTF-8\"?><ext-config>");
		List<Element> children = mv.getChildren();
		for(int i=0; i<children.size(); i++){
			Element comp = children.get(i);
			if(comp instanceof TextContext){
				xmlSer.createText(sb, (TextContext)comp);
			}else if(comp instanceof TextFieldContext){
				//处理隐藏参数
				TextFieldContext input = (TextFieldContext)comp;
				sb.append("<textField type=\"hidden\" id=\""+input.getId()+"\"");
				if(input.getDefaultValue() != null){
					sb.append(" defaultValue=\""+input.getDefaultValue()+"\"");
				}
				sb.append("/>");
			}else if(comp instanceof CrossReportContext){
				xmlSer.createCrossReport(sb, (CrossReportContext)comp);
			}else if(comp instanceof ChartContext){
				xmlSer.createChart(sb, (ChartContext)comp);
			}
			//对每个组件之间启用换行
			/**
			if(i != children.size() - 1){
				sb.append("<br/>");
			}
			**/
		}
		sb.append("</ext-config>");
		return sb.toString();
	}

	/**
	 * 构建 多维分析 的 mv 对象
	 */
	public MVContext json2MV(JSONObject json) throws Exception{
		//创建MV
		MVContext mv = new MVContextImpl();
		mv.setChildren(new ArrayList());
		String formId = ExtConstants.formIdPrefix + IdCreater.create();
		mv.setFormId(formId);
		mv.setMvid(deftMvId);
		
		JSONArray params = json.getJSONArray("params"); 
		
		//构建参数Text
		if(!params.isEmpty()){
			StringBuffer sb = new StringBuffer("参数： ");
			TextContext parStr = new TextContextImpl();
			for(int i=0; i<params.size(); i++){
				JSONObject param = params.getJSONObject(i);
				String name = param.getString("name");
				String type = param.getString("type");
				//String colname = param.getString("colname");
				/**
				if("frd".equals(type)){
					sb.append(name + "(" + param.get("valStrs")+")");
				}else if("month".equals(type) || "day".equals(type)){
					sb.append(name + "(" + param.get("valStrs") + ")");
				}
				**/
				sb.append(name + "(" + (param.get("valStrs") == null ?"":param.get("valStrs"))+")");
				sb.append("  ");
				
				
			}
			parStr.setText(sb.toString());
			mv.getChildren().add(parStr);
			parStr.setParent(mv);
		}
		
		JSONArray comps = json.getJSONArray("comps");
		for(int i=0; i<comps.size(); i++){
			JSONObject obj = comps.getJSONObject(i);
			String type = obj.getString("type");
			if("text".equals(type)){
				String txt = obj.getString("text");
				createText(mv, txt);
			}
			if("table".equals(type)){
				String cubeId = obj.getString("tid");
				JSONObject cube = findCubeById(json, cubeId);
				JSONObject dset = findDataSetById(json, cube.getString("datasetid"));
				JSONObject dsource = findDataSourceById(json, dset.getString("dsid"));
				createTable(mv, obj.getJSONObject("tableJson"), obj.getJSONArray("kpiJson"), params, dset, dsource, cube);
			}
			if("chart".equals(type)){
				String cubeId = obj.getString("tid");
				JSONObject cube = findCubeById(json, cubeId);
				JSONObject dset = findDataSetById(json, cube.getString("datasetid"));
				JSONObject dsource = findDataSourceById(json, dset.getString("dsid"));
				createChart(mv, obj.getJSONObject("chartJson"), obj.getJSONArray("kpiJson"),  params, dset, dsource, cube);
			}
		}
		
		//创建dataSource
		JSONArray dss = json.getJSONArray("datasource");
		for(int i=0; i<dss.size(); i++){
			JSONObject dsourceJson = dss.getJSONObject(i);
			DataSourceContext dsource = new DataSourceContext();
			dsource.putProperty("id", dsourceJson.getString("dsid"));
			dsource.putProperty("linktype", dsourceJson.getString("linktype"));
			dsource.putProperty("linkname", dsourceJson.getString("linkname"));
			dsource.putProperty("linkpwd", dsourceJson.getString("linkpwd"));
			dsource.putProperty("linkurl", dsourceJson.getString("linkurl"));
		
			//放入MV
			if(mv.getDsources() == null){
				mv.setDsources(new HashMap());
			}
			mv.getDsources().put(dsource.getId(), dsource);
		}
		return mv;
	}
	
	public static JSONObject findDataSourceById(JSONObject json,String id){
		JSONObject ret = null;
		JSONArray dsets = json.getJSONArray("datasource");
		for(int i=0; i<dsets.size(); i++){
			JSONObject dset = dsets.getJSONObject(i);
			if(dset.getString("dsid").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	}
	
	public static JSONObject findDataSetById(JSONObject json, String id){
		JSONObject ret = null;
		JSONArray dsets = json.getJSONArray("dataset");
		for(int i=0; i<dsets.size(); i++){
			JSONObject dset = dsets.getJSONObject(i);
			if(dset.getString("datasetid").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	}
	
	public static JSONObject findCubeById(JSONObject json, String id){
		JSONObject ret = null;
		JSONArray dsets = json.getJSONArray("cube");
		for(int i=0; i<dsets.size(); i++){
			JSONObject dset = dsets.getJSONObject(i);
			if(dset.getString("id").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	} 
	
	public static String htmlPage(String body, String host){
		StringBuffer sb = new StringBuffer();
		
		sb.append("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">");
		sb.append("<html xmlns=\"http://www.w3.org/1999/xhtml\">");
		sb.append("<head>");
		sb.append("<title>睿思BI-精简版</title>");
		sb.append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
		sb.append("<script type=\"text/javascript\" src=\""+host+"/ext-res/js/jquery.min.js\"></script>");
		sb.append("<script type=\"text/javascript\" src=\""+host+"/ext-res/js/ext-base.js\"></script>");
		sb.append("<script type=\"text/javascript\" src=\""+host+"/ext-res/highcharts/highcharts.js\"></script>");
		sb.append("<script type=\"text/javascript\" src=\""+host+"/ext-res/js/sortabletable.js\"></script>");
		sb.append("<link rel=\"stylesheet\" type=\"text/css\" href=\""+host+"/ext-res/css/fonts-min.css\" />");
		sb.append("<link rel=\"stylesheet\" type=\"text/css\" href=\""+host+"/ext-res/css/boncbase.css\" />");
		sb.append("</head>");
		sb.append("<body class=\"yui-skin-sam\">");
		sb.append(body);
		sb.append("</body>");
		sb.append("</html>");
		
		return sb.toString();
	}

	public ReportXMLService getXmlSer() {
		return xmlSer;
	}
}
