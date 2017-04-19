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
import com.ruisi.ext.engine.view.context.dsource.DataSourceContext;
import com.ruisi.ext.engine.view.context.grid.PageInfo;
import com.ruisi.ext.engine.view.context.gridreport.GridCell;
import com.ruisi.ext.engine.view.context.gridreport.GridReportContext;
import com.ruisi.ext.engine.view.context.gridreport.GridReportContextImpl;

/**
 * 明细表 service
 * @author hq
 * @date 2016-11-15
 */
public class GridService {
	
	public final static String deftMvId = "mv.grid.gridReport";

	public MVContext json2MV(JSONObject gridJson, JSONArray params, JSONObject dset, JSONObject dsourceJson, boolean export) throws Exception{
		
		//创建MV
		MVContext mv = new MVContextImpl();
		mv.setChildren(new ArrayList());
		String formId = ExtConstants.formIdPrefix + IdCreater.create();
		mv.setFormId(formId);
		mv.setMvid(deftMvId);
		
		//创建corssReport
		GridReportContext cr = json2Grid(gridJson, export);
		//设置ID
		String id = ExtConstants.reportIdPrefix + IdCreater.create();
		cr.setId(id);
		
		//创建数据sql
		String sql = this.createSql(gridJson, params, dset);
		String name = TemplateManager.getInstance().createTemplate(sql);
		cr.setTemplateName(name);
		cr.setRefDsource( dsourceJson.getString("dsid"));  //使用定义的数据源
		
		mv.getChildren().add(cr);
		cr.setParent(mv);
		
		Map<String, GridReportContext> crs = new HashMap<String, GridReportContext>();
		crs.put(cr.getId(), cr);
		mv.setGridReports(crs);
		
		//创建dataSource
		createDsource(dsourceJson, mv);
		
		return mv;
	}
	
	public GridReportContext json2Grid(JSONObject gridJson, boolean export){
		GridReportContext grid = new GridReportContextImpl();
		if(export){
			grid.setOut("html");
		}else{
			grid.setOut("query"); //采用明细查询 方式输出
		}
		JSONArray cols = gridJson.getJSONArray("cols");
		//生成head
		GridCell[][] headers = new GridCell[1][cols.size()];
		for(int i=0; i<cols.size(); i++){
			JSONObject col = cols.getJSONObject(i);
			GridCell cell = new GridCell();
			cell.setColSpan(1);
			cell.setRowSpan(1);
			String name = col.getString("name");
			String id = col.getString("id");
			String dispName = (String)col.get("dispName");
			cell.setDesc(dispName == null || dispName.length() == 0 ? name : dispName);
			cell.setAlias(id);
			headers[0][i] = cell;
		}
		grid.setHeaders(headers);
		
		//生成Detail
		GridCell[][] detail = new GridCell[1][cols.size()];
		for(int i=0; i<cols.size(); i++){
			JSONObject col = cols.getJSONObject(i);
			GridCell cell = new GridCell();
			String id = col.getString("id");
			String type = (String)col.get("type");
			cell.setAlias(id);
			if("Double".equalsIgnoreCase(type) || "Int".equalsIgnoreCase(type)){
				cell.setAlign("right"); //数字靠右，文字靠左
			}
			String fmt = (String)col.get("fmt");
			if(fmt != null && fmt.length() > 0){
				cell.setFormatPattern(fmt);
			}
			detail[0][i] = cell;
		}
		grid.setDetails(detail);
		
		//设置分页
		Object pageSize = gridJson.get("pageSize");
		if(pageSize == null){
			pageSize = 10;
		}
		PageInfo page = new PageInfo();
		page.setPagesize((Integer)pageSize);
		grid.setPageInfo(page);
		return grid;
	}
	
	public String createSql(JSONObject gridJson, JSONArray pageParams, JSONObject dset){
		String dsetId = dset.getString("datasetid");
		JSONArray joinTabs = dset.getJSONArray("joininfo");
		Map<String, String> tableAlias = new HashMap<String, String>(); //表名称与别名的键值对
		tableAlias.put(dset.getString("master"), "a0");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			tableAlias.put(tab.getString("ref"), "a" + (i+1));
		}
		
		StringBuffer sb = new StringBuffer("select ");
		JSONArray cols = gridJson.getJSONArray("cols");
		for(int i=0; i<cols.size(); i++){
			JSONObject col = cols.getJSONObject(i);
			String id = col.getString("id");
			String name = col.getString("name");
			String tname = col.getString("tname");
			String expression = (String)col.get("expression");  //表达式字段
			if(expression != null && expression.length() > 0){
				sb.append(" "+ expression + " as " + id);
			}else{
				sb.append(" "+tableAlias.get(tname)+"." + name + " as " + id);
			}
			if(i != cols.size() - 1){
				sb.append(",");
			}
		}
		
		sb.append(" from ");
		sb.append(dset.getString("master") + " a0 ");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			String ref = tab.getString("ref");
			sb.append(", "+ref+" "+tableAlias.get(ref)+" ");
		}
		sb.append("where 1=1 ");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			sb.append("and a0."+tab.getString("col")+"=a"+(i+1)+"."+tab.getString("refKey"));
			sb.append(" ");
		}
		//添加数据集筛选
		Object o = dset.get("param");
		if(o != null){
			JSONArray params = (JSONArray)o;
			for(int i=0; i<params.size(); i++){
				JSONObject p = (JSONObject)params.get(i);
				String col = p.getString("col");
				String tname = p.getString("tname");
				String type = p.getString("type");
				String val = p.getString("val");
				String val2 = p.getString("val2");
				sb.append(" and "+tableAlias.get(tname)+"."+col);
				sb.append(type);
				if(!"String".equalsIgnoreCase(type)){
					sb.append(val);
				}else{
					sb.append("'");
					sb.append(val);
					sb.append("'");
				}
				if("between".equals(type)){
					sb.append(" and ");
					if(!"String".equalsIgnoreCase(type)){
						sb.append(val2);
					}else{
						sb.append("'");
						sb.append(val2);
						sb.append("'");
					}
				}
				sb.append(" ");
			}
		}
		//添加参数筛选
		for(int i=0; i<pageParams.size(); i++){
			JSONObject p = pageParams.getJSONObject(i);
			String type = p.getString("type");
			String name = p.getString("name");
			String tname = p.getString("tname");
			String expression = (String)p.get("expression");
			String datasetid = p.getString("datasetid");
			if(!dsetId.equals(datasetid)){
				continue; //如果不属于一个数据集，忽略此参数
			}
			if("Double".equals(type) || "Int".equals(type)){
				JSONObject filter = p.getJSONObject("filter");
				if(filter == null ||  filter.isNullObject()){
					continue;
				}
				String filterType = filter.getString("filterType");
				Object val1 = filter.get("val1");
				sb.append(" and ");
				if(expression == null || expression.length()== 0){
					sb.append(tableAlias.get(tname) + "." + name);
				}else{
					sb.append(expression);
				}
				sb.append(" " + filterType + " " + val1 );
				if("between".equals(filterType)){
					sb.append(" and " + filter.get("val2"));
				}
			}else if("Date".equals(type)){
				JSONObject filter = p.getJSONObject("filter");
				if(filter == null || filter.isNullObject()){
					continue;
				}
				String stdt = filter.getString("stdt");
				String enddt = filter.getString("enddt");
				sb.append(" and ");
				if(expression == null || expression.length()== 0){
					sb.append(tableAlias.get(tname) + "." + name);
				}else{
					sb.append(expression);
				}
				sb.append(" between '"+stdt+" 00:00:00' and '"+enddt+" 23:59:59'");
			}else{  //字符串筛选
				JSONObject filter = p.getJSONObject("filter");
				if(filter == null || filter.isNullObject()){
					continue;
				}
				String filterType = filter.getString("filterType");
				Object val1 = filter.get("val1");
				sb.append(" and ");
				if(expression == null || expression.length()== 0){
					sb.append(tableAlias.get(tname) + "." + name);
				}else{
					sb.append(expression);
				}
				sb.append(" " + filterType);
				if("like".equals(filterType)){
					sb.append(" '%" + val1+"%'");
				}else{
					sb.append(" '" + val1+"'");
				}
			}
		}
		//排序字段
		for(int i=0; i<cols.size(); i++){
			JSONObject col = cols.getJSONObject(i);
			String id = col.getString("id");
			String sort = (String)col.get("sort");
			if(sort != null && sort.length() > 0){
				sb.append(" order by " + id + " ");
				sb.append(sort);
				break;
			}
		}
		return sb.toString().replaceAll("@", "'");
	}
	
	/**
	 * 创建dataSource
	 */
	public static void createDsource(JSONObject dsourceJson, MVContext mv){
		DataSourceContext dsource = new DataSourceContext();
		dsource.putProperty("id", dsourceJson.getString("dsid"));
		Object use = dsourceJson.getString("use");
		dsource.putProperty("use", use == null ? null : use.toString());
		if(use == null || "jdbc".equalsIgnoreCase(use.toString())){
			dsource.putProperty("linktype", dsourceJson.getString("linktype"));
			dsource.putProperty("linkname", dsourceJson.getString("linkname"));
			dsource.putProperty("linkpwd", dsourceJson.getString("linkpwd"));
			dsource.putProperty("linkurl", dsourceJson.getString("linkurl"));
		}else{
			dsource.putProperty("jndiname", dsourceJson.getString("jndiname"));
		}
		//放入MV
		if(mv.getDsources() == null){
			mv.setDsources(new HashMap<String, DataSourceContext>());
		}
		mv.getDsources().put(dsource.getId(), dsource);
	}
}
