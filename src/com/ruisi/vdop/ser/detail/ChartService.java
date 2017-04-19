package com.ruisi.vdop.ser.detail;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.ExtConstants;
import com.ruisi.ext.engine.init.TemplateManager;
import com.ruisi.ext.engine.util.IdCreater;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.ext.engine.view.context.MVContextImpl;
import com.ruisi.ext.engine.view.context.chart.ChartContext;
import com.ruisi.ext.engine.view.context.chart.ChartContextImpl;
import com.ruisi.ext.engine.view.context.chart.ChartKeyContext;

public class ChartService {
	
	public final static String deftMvId = "detail.chart.tmp";
	
	public MVContext json2MV(JSONObject chartj, JSONArray kpij, JSONArray params, JSONObject dset, JSONObject dsourceJson) throws Exception{
		//创建MV
		MVContext mv = new MVContextImpl();
		mv.setChildren(new ArrayList());
		String formId = ExtConstants.formIdPrefix + IdCreater.create();
		mv.setFormId(formId);
		mv.setMvid(deftMvId);
		
		//创建corssReport
		ChartContext cr = json2Chart(chartj, kpij);
		//设置ID
		String id = ExtConstants.reportIdPrefix + IdCreater.create();
		cr.setId(id);
		
		//创建数据sql
		String sql = this.createSql(chartj, kpij, params, dset);
		String name = TemplateManager.getInstance().createTemplate(sql);
		cr.setTemplateName(name);
		cr.setRefDsource( dsourceJson.getString("dsid"));  //使用定义的数据源
		
		mv.getChildren().add(cr);
		cr.setParent(mv);
		
		//创建dataSource
		GridService.createDsource(dsourceJson, mv);
		return mv;
	}
	
	public ChartContext json2Chart(JSONObject chartJson, JSONArray kpiJson){
		ChartContext ctx = new ChartContextImpl();
		//设置x
		JSONObject obj = chartJson.getJSONObject("xcol");
		if(obj != null && !obj.isNullObject() && !obj.isEmpty()){
			String id = obj.getString("id");
			ctx.setXcol(id);
		}else{
			ctx.setXcol("xcol");
		}
		
		//取指标
		JSONObject kpiInfo = kpiJson.getJSONObject(0);
		String y = kpiInfo.getString("id");
		ctx.setYcol(y);
		
		//如果是散点图或气泡图，需要 y2col
		if(kpiJson.size() > 1){
			ctx.setY2col(kpiJson.getJSONObject(1).getString("id"));
		}
		if(kpiJson.size() > 2){
			ctx.setY3col(kpiJson.getJSONObject(2).getString("id"));
		}
		
		JSONObject scol = chartJson.getJSONObject("scol");
		if(scol != null && !scol.isNullObject() && !scol.isEmpty()){
			String id = scol.getString("id");
			ctx.setScol(id);
		}
		
		ctx.setShape(chartJson.getString("type"));
		ctx.setWidth("auto");
		ctx.setHeight("240");
		
		//设置ID
		String chartId = ExtConstants.chartIdPrefix + IdCreater.create();
		ctx.setId(chartId);
		
		//设置配置信息
		List<ChartKeyContext> properties = new ArrayList();
	
		//格式化配置信息
		Object fmt = kpiInfo.get("fmt");
		if(fmt != null && fmt.toString().length() > 0 && !"null".equalsIgnoreCase(fmt.toString())){
			properties.add(new ChartKeyContext("formatCol", fmt.toString()));
		}
	
		if("pie".equals(ctx.getShape())){
			properties.add(new ChartKeyContext("showLegend","true"));
			properties.add(new ChartKeyContext("showLabel","true"));
			ctx.setHeight("280"); //重新设置高度,宽度
			ctx.setWidth("750");
		}else
		//如果无scol,不显示lengend
		if(scol == null || scol.isNullObject() || scol.isEmpty()){
			properties.add(new ChartKeyContext("showLegend","false"));
		}
		
		if("gauge".equals(ctx.getShape())){
			ctx.setWidth("210");
		}
		if("radar".equals(ctx.getShape())){
			ctx.setHeight("340"); //重新设置雷达图的高度
		}
		//设置 ydesc
		String dispName = (String)kpiInfo.get("dispName");
		String name = (String)kpiInfo.get("name");
		properties.add(new ChartKeyContext("ydesc", dispName == null || dispName.length() == 0 ? name:dispName ));
		
		if("bubble".equals(ctx.getShape()) || "scatter".equals(ctx.getShape())){
			JSONObject kpiInfo2 = kpiJson.getJSONObject(1);
			//对于散点图和气泡图，需要设置xdesc
			String dispName2 = (String)kpiInfo2.get("dispName");
			String name2 = (String)kpiInfo2.get("name");
			properties.add(new ChartKeyContext("xdesc", dispName2 == null || dispName2.length() == 0 ? name2:dispName2 ));
		}
		
		ctx.setProperties(properties);
		
		return ctx;
	}
	
	public String createSql(JSONObject chartj, JSONArray kpij, JSONArray pageParams, JSONObject dset){
		String dsetId = dset.getString("datasetid");
		JSONArray joinTabs = dset.getJSONArray("joininfo");
		Map<String, String> tableAlias = new HashMap<String, String>(); //表名称与别名的键值对
		tableAlias.put(dset.getString("master"), "a0");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			tableAlias.put(tab.getString("ref"), "a" + (i+1));
		}
		List<String> group = new ArrayList<String>();
		
		StringBuffer sb = new StringBuffer("select ");
		//处理横轴
		JSONObject obj = chartj.getJSONObject("xcol");
		if(obj != null && !obj.isNullObject() && !obj.isEmpty()){
			String id = obj.getString("id");
			String name = obj.getString("name");
			String tname = obj.getString("tname");
			String expression = (String)obj.get("expression");  //表达式字段
			if(expression != null && expression.length() > 0){
				sb.append(" "+ expression + " as " + id);
				group.add(expression);
			}else{
				sb.append(" "+tableAlias.get(tname)+"." + name + " as " + id);
				group.add(tableAlias.get(tname)+"." + name);
			}
			sb.append(",");
		}else{
			sb.append(" '合计' as xcol,");
		}
		//处理图例
		obj = chartj.getJSONObject("scol");
		if(obj != null && !obj.isNullObject() && !obj.isEmpty()){
			String id = obj.getString("id");
			String name = obj.getString("name");
			String tname = obj.getString("tname");
			String expression = (String)obj.get("expression");  //表达式字段
			if(expression != null && expression.length() > 0){
				sb.append(" "+ expression + " as " + id);
				group.add(expression);
			}else{
				sb.append(" "+tableAlias.get(tname)+"." + name + " as " + id);
				group.add(tableAlias.get(tname)+"." + name);
			}
			sb.append(",");
		}
		//处理指标
		for(int i=0; i<kpij.size(); i++){
			JSONObject kpi = kpij.getJSONObject(i);
			String id = kpi.getString("id");
			String name = kpi.getString("name");
			String tname = kpi.getString("tname");
			String expression = (String)kpi.get("expression");  //表达式字段
			String aggre = (String)kpi.get("aggre");
			if(expression != null && expression.length() > 0){
				sb.append(" "+aggre+"("+ expression + ") as " + id);
			}else{
				sb.append(" "+aggre+"("+tableAlias.get(tname)+"." + name +")"+ " as " + id);
			}
			if(i != kpij.size() - 1){
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
		//group by
		if(group.size() > 0){
			sb.append(" group by ");
			for(int i=0; i<group.size(); i++){
				String g = group.get(i);
				sb.append(g);
				if(i != group.size() - 1){
					sb.append(",");
				}
			}
		}
		return sb.toString().replaceAll("@", "'");
	}

}
