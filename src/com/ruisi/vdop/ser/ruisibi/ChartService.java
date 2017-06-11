package com.ruisi.vdop.ser.ruisibi;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.ExtConstants;
import com.ruisi.ext.engine.init.TemplateManager;
import com.ruisi.ext.engine.util.IdCreater;
import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.ext.engine.view.context.MVContextImpl;
import com.ruisi.ext.engine.view.context.chart.ChartContext;
import com.ruisi.ext.engine.view.context.chart.ChartContextImpl;
import com.ruisi.ext.engine.view.context.chart.ChartKeyContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridDataCenterContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridDataCenterContextImpl;
import com.ruisi.ext.engine.view.context.dc.grid.GridFilterContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridSetConfContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridSortContext;
import com.ruisi.ext.engine.view.context.dsource.DataSourceContext;
import com.ruisi.ext.engine.view.context.form.InputField;
import com.ruisi.ext.engine.view.context.html.TextContext;
import com.ruisi.ext.engine.view.context.html.TextContextImpl;
import com.ruisi.vdop.ser.utils.DBUtils;
import com.ruisi.vdop.ser.utils.DataService;
import com.ruisi.vdop.util.VDOPUtils;

public class ChartService {
	
	public final static String deftMvId = "mv.chart.tmp";
	
	private Map<String, InputField> mvParams = new HashMap<String, InputField>(); //mv的参数
	
	private Map<String, String> tableAlias = new HashMap<String, String>(); //表名称与别名的键值对
	
	private Integer xcolId; //x轴维度ID
	
	private List<String> orderCols = new ArrayList<String>(); //需要进行排序的字段
	
	private DataControlInterface dataControl; //数据权限控制
	
	private JSONObject chartJson;
	private JSONArray kpiJson;
	private JSONObject dsourceJson;
	private JSONObject dsetJson;
	
	public ChartService(){
		String clazz = ExtContext.getInstance().getConstant("dataControl");
		if(clazz != null && clazz.length() != 0){
			try {
				dataControl = (DataControlInterface)Class.forName(clazz).newInstance();
			} catch (Exception e) {
				e.printStackTrace();
			} 
		}
	}
	
	public static String formatUnits(JSONObject kpi){
		String rate = kpi.getString("rate");
		if(rate == null || rate.length() == 0 || "null".equalsIgnoreCase(rate)){
			return "";
		}
		int r = Integer.parseInt(rate);
		if(r == 1000){
			return "千";
		}else if(r == 10000){
			return "万";
		}else if(r == 1000000){
			return "百万";
		}else if(r == 100000000){
			return "亿";
		}
		return "";
	}
	
	public ChartContext json2Chart(){
		ChartContext ctx = new ChartContextImpl();
		ctx.setRefDsource(dsourceJson.getString("dsid"));
		//设置x
		JSONObject obj = chartJson.getJSONObject("xcol");
		if(obj != null && !obj.isNullObject() && !obj.isEmpty()){
			String tp = obj.getString("type");
			String tname = obj.getString("tableName");
			String tcol = obj.getString("tableColKey");
			String tcolName = obj.getString("tableColName");
			boolean dyna = obj.getBoolean("dyna");
			String id = obj.getString("id");
			//判断维度是否关联了码表
			if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
				if(dyna){
					ctx.setXcol("d_" + id); //d_ + 维度ID
					ctx.setXcolDesc(ctx.getXcol());
				}else{
					ctx.setXcol(tableAlias.get(obj.getString("tname")) + "_" + obj.getString("colname")); //表别名 + 维度字段
					ctx.setXcolDesc(ctx.getXcol());
				}
			}else{
				ctx.setXcol(tableAlias.get(obj.getString("tableName")) + "_" + obj.getString("tableColName"));
				ctx.setXcolDesc(tableAlias.get(obj.getString("tableName")) + "_" + obj.getString("tableColKey"));
			}
			if("day".equals(tp)){
				ctx.setDateType(tp);
				ctx.setDateTypeFmt((String)obj.get("dateformat"));
			}
			this.xcolId = obj.getInt("id");
		}else{
			ctx.setXcol("xcol");
			ctx.setXcolDesc("xcolDesc");
		}
		//取指标
		JSONObject kpiInfo = kpiJson.getJSONObject(0);
		String y = kpiInfo.getString("alias");
		ctx.setYcol(y);
		
		//如果是散点图或气泡图，需要 y2col
		if(kpiJson.size() > 1){
			ctx.setY2col(kpiJson.getJSONObject(1).getString("alias"));
		}
		if(kpiJson.size() > 2){
			ctx.setY3col(kpiJson.getJSONObject(2).getString("alias"));
		}
		
		JSONObject scol = chartJson.getJSONObject("scol");
		if(scol != null && !scol.isNullObject() && !scol.isEmpty()){
			String tname = scol.getString("tableName");
			String tcol = scol.getString("tableColKey");
			String tcolName = scol.getString("tableColName");
			boolean dyna = scol.getBoolean("dyna");
			String id = scol.getString("id");
			//判断维度是否关联了码表
			if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
				if(dyna){
					ctx.setScol("d_" + id);
				}else{
					ctx.setScol(tableAlias.get(scol.getString("tname")) + "_" + scol.getString("colname")); //表别名 + 维度字段
				}
			}else{
				ctx.setScol(tableAlias.get(scol.getString("tableName")) + "_" + scol.getString("tableColName")); 
			}
		}
		
		ctx.setShape(chartJson.getString("type"));
		ctx.setWidth("auto");
		ctx.setHeight("240");
		
		//设置ID
		String chartId = ExtConstants.chartIdPrefix + IdCreater.create();
		ctx.setId(chartId);
		
		//设置配置信息
		List<ChartKeyContext> properties = new ArrayList();
	
		String dw = formatUnits(kpiInfo) +kpiInfo.get("unit");
		properties.add(new ChartKeyContext("ydesc", kpiInfo.getString("kpi_name")+ (dw.length() == 0 || dw.equals("null") ? "":"(" + dw+")")));
		
		//格式化配置信息
		Object fmt = kpiInfo.get("fmt");
		if(fmt != null && fmt.toString().length() > 0 && !"null".equalsIgnoreCase(fmt.toString())){
			properties.add(new ChartKeyContext("formatCol", fmt.toString()));
		}
		
		//设置倍率
		Object rate1 = kpiInfo.get("rate");
		if(rate1 != null && !rate1.toString().equals("null")){
			ctx.setRate(kpiInfo.getInt("rate"));
		}
		if(kpiJson.size() > 1){
			JSONObject kpi2 = kpiJson.getJSONObject(1);
			Object rate2 = kpi2.get("rate");
			if(rate2 != null && !rate2.toString().equals("null")){
				ctx.setRate2(kpi2.getInt("rate"));
			}
			/**
			Object fmt2 = kpi2.get("fmt");
			if(fmt2 != null && fmt2.toString().length() > 0 && !"null".equalsIgnoreCase(fmt2.toString())){
				properties.add(new ChartKeyContext("formatCol2", fmt2.toString()));
			}
			**/
		}
		if(kpiJson.size() > 2){
			JSONObject kpi3 = kpiJson.getJSONObject(2);
			Object rate3 = kpi3.get("rate");
			if(rate3 != null && !rate3.toString().equals("null")){
				ctx.setRate3(kpi3.getInt("rate"));
			}
		}
		
		/**
		Object unit = kpiInfo.get("unit");
		if(unit != null && unit.toString().length() > 0 && !"null".equalsIgnoreCase(unit.toString())){
			properties.add(new ChartKeyContext("unitCol",unit.toString()));
		}
		**/
		//启用钻取
		properties.add(new ChartKeyContext("action","drillChart"));
		
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
		if("bubble".equals(ctx.getShape()) || "scatter".equals(ctx.getShape())){
			JSONObject kpiInfo2 = kpiJson.getJSONObject(1);
			//对于散点图和气泡图，需要设置xdesc
			properties.add(new ChartKeyContext("xdesc", kpiInfo2.getString("kpi_name") + "(" + formatUnits(kpiInfo2) +kpiInfo2.get("unit")+")"));
		}
		
		ctx.setProperties(properties);
		
		return ctx;
	}

	/**
	 * 创建图形钻取菜单
	 * @param mv
	 */
	public void createChartDrill(MVContext mv, String compId){
		StringBuffer txt = new StringBuffer();
		txt.append("<div class=\"chartdrillmenu\">");
		
		int cnt = 0;
		
		Object drillParam = chartJson.get("params");
		if(drillParam != null){
			JSONArray drills = (JSONArray)drillParam;
			for(int j=0; j<drills.size(); j++){
				JSONObject dim = drills.getJSONObject(j);
				if(cnt == 0){
					txt.append("钻取维：");
				}
				String pos = (String)dim.get("pos");
				String valDesc = (String)dim.get("valDesc");
				if(valDesc == null || valDesc.length() == 0){
					valDesc = "";
				}else{
					valDesc = "(" + valDesc + ")";
				}
				txt.append("<span class=\"chartdrillDim\"><a href=\"javascript:;\" title=\"上卷\" onclick=\"chartGoupDim("+compId+", "+dim.getString("id")+", '"+pos+"', true)\" style=\"opacity:0.5\"></a>"+dim.get("dimdesc")+valDesc+"</span>");
				cnt++;
			}
		}
		if(cnt == 0){
			txt.append("<span class=\"charttip\">(点击图形节点进行钻取分析)</span>");
		}
		txt.append("</div>");
		
		TextContext text = new TextContextImpl();
		text.setText(txt.toString());
		text.setParent(mv);
		mv.getChildren().add(text);
	}
	
	public MVContext json2MV(String compId, String cubeId,JSONArray params, JSONObject divison) throws Exception{
		//先获取需要关联的表及表别名字段
		JSONArray joinTabs = dsetJson.getJSONArray("joininfo");
		tableAlias.put(dsetJson.getString("master"), "a0");
		for(int i=0; i<joinTabs.size(); i++){
			JSONObject tab = joinTabs.getJSONObject(i);
			tableAlias.put(tab.getString("ref"), "a" + (i+1));
		}
		
		//创建MV
		MVContext mv = new MVContextImpl();
		mv.setChildren(new ArrayList());
		String formId = ExtConstants.formIdPrefix + IdCreater.create();
		mv.setFormId(formId);
		mv.setMvid(deftMvId);
		
		//创建图形钻取项
		this.createChartDrill(mv, compId);
		
		//创建chart
		ChartContext cr = this.json2Chart();
	
		String sql = createSql(params);
		GridDataCenterContext dc = this.createDataCenter(sql, params, cubeId, dsetJson.getString("master"));
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
		
		//创建dataSource
		DataSourceContext dsource = new DataSourceContext();
		dsource.putProperty("id", dsourceJson.getString("dsid"));
		Object use = dsourceJson.get("use");
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
			mv.setDsources(new HashMap());
		}
		mv.getDsources().put(dsource.getId(), dsource);
		
		return mv;
	}
	
	
	
	public GridDataCenterContext createDataCenter(String sql, JSONArray params, String cubeId, String master) throws Exception{
		GridDataCenterContext ctx = new GridDataCenterContextImpl();
		GridSetConfContext conf = new GridSetConfContext();
		conf.setRefDsource(dsourceJson.getString("dsid"));
		
		String name = TemplateManager.getInstance().createTemplate(sql);
		conf.setTemplateName(name);
		
		ctx.setConf(conf);
		ctx.setId("DC-" + IdCreater.create());
		
		//判断是否需要数据进行排序
		if(orderCols.size() > 0){
			GridSortContext sort = new GridSortContext();
			String[] cols = new String[orderCols.size()];
			String[] types = new String[orderCols.size()];
			for(int i=0; i<orderCols.size(); i++){
				String[] strs = orderCols.get(i).split(",");
				cols[i] = strs[0];
				types[i] = strs[1];
			}
			sort.setColumn(cols);
			sort.setType(types);
			sort.setChangeOldOrder(true);
			ctx.getProcess().add(sort);
		}
		
		//判断数据是否需要指标筛选
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			Object ftobj = kpi.get("filter");
			if(ftobj != null){
				GridFilterContext filter = new GridFilterContext();
				
				JSONObject ft = (JSONObject)ftobj;
				String alias = kpi.getString("alias");
				filter.setColumn(alias);
				String tp = ft.getString("filterType");
				filter.setFilterType(tp);
				double val1 = ft.getDouble("val1");
				String kpiFmt = kpi.getString("fmt");
				if(kpiFmt != null && kpiFmt.length() > 0 && !"null".equalsIgnoreCase(kpiFmt) && kpiFmt.endsWith("%")){
					val1 = val1 / 100;
				}
				
				String rate = kpi.getString("rate");
				if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
					val1 = val1 * Integer.parseInt(rate);
				}
				filter.setValue(String.valueOf(val1));
				if("between".equals(tp)){
					double val2 = ft.getDouble("val2");
					if(kpiFmt != null && kpiFmt.length() > 0 && !"null".equalsIgnoreCase(kpiFmt) && kpiFmt.endsWith("%")){
						val2 = val2 / 100;
					}
					if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
						val2 = val2 * Integer.parseInt(rate);
					}
					filter.setValue2(String.valueOf(val2));
				}
				ctx.getProcess().add(filter);
			}
		}
		
		return ctx;
	}
	
	
	public static int type2value(String tp){
		int curDate = 4;
		if(tp.equals("year")){
			curDate = 4;
		}else if(tp.equals("quarter")){
			curDate = 3;
		}else if(tp.equals("month")){
			curDate = 2;
		}else if(tp.equals("day")){
			curDate = 1;
		}
		return curDate;
	}
	
	
	/**
	 * 创建sql语句所用函数，图形用这个函数创建SQL
	 */
	public String createSql(JSONArray paramJson) {
		JSONArray joinTabs = dsetJson.getJSONArray("joininfo");
		List<String> groupCols = new ArrayList<String>(); //需要进行分组的字段
		List<JSONObject> filterCols = new ArrayList<JSONObject>(); //需要进行过滤的维度
		Map<String, Object> useTables = new HashMap<String, Object>();  //此次查询使用的表,生成SQL时未选择的表不关联
		//指标排序
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			Object sort = kpi.get("sort");
			if(sort != null && sort.toString().length() > 0){
				orderCols.add(kpi.getString("alias") + "," + sort);
			}
		}
		StringBuffer sql = new StringBuffer();
		sql.append("select ");
		//xcol
		JSONObject xcol = chartJson.getJSONObject("xcol");
		if(!xcol.isNullObject() && !xcol.isEmpty()){
			String tname = xcol.getString("tableName");
			String tcol = xcol.getString("tableColKey");
			String tcolName = xcol.getString("tableColName");
			String id = xcol.getString("id");
			//判断维度是否关联了码表
			if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
				//未关联码表
				boolean dyna = xcol.getBoolean("dyna"); //是否动态列, 动态列采用 d_id 的 alias
				String incomeTable = xcol.getString("tname");
				String str1 = dyna ? xcol.getString("colname") : this.tableAlias.get(incomeTable)+"." + xcol.getString("colname"); 
				sql.append(str1);
				sql.append(" ");
				sql.append(dyna ? "d_" + id :this.tableAlias.get(incomeTable)+"_" + xcol.getString("colname"));
				sql.append(",");
				groupCols.add(str1);
				//xcol 排序
				String ord = xcol.getString("dimord");
				if(ord != null && ord.length() > 0 && !"null".equalsIgnoreCase(ord)){
					orderCols.add((dyna? "d_" + id : tableAlias.get(incomeTable)+"_"+ xcol.getString("colname")) + "," + ord);
				}
			}else{
				//关联码表
				String str1 = this.tableAlias.get(tname)+"." + tcol; 
				sql.append(str1);
				groupCols.add(str1);
				sql.append(" ");
				sql.append(this.tableAlias.get(tname)+"_" + tcol);
				sql.append(",");
				String str2 = this.tableAlias.get(tname)+"." + tcolName;
				sql.append(str2);
				groupCols.add(str2);
				sql.append(" ");
				sql.append(this.tableAlias.get(tname)+"_" + tcolName);
				sql.append(",");
				//xcol 排序
				String ord = xcol.getString("dimord");
				if(ord != null && ord.length() > 0 && !"null".equalsIgnoreCase(ord)){
					orderCols.add(tableAlias.get(tname)+"_"+tcol + "," + ord);
				}
			}
			//xcol 过滤
			Object vals = xcol.get("vals");
			if(vals != null && vals.toString().length() > 0 && !"null".equalsIgnoreCase(vals.toString())){
				filterCols.add(xcol);
			}
			useTables.put((String)xcol.get("tname"), null);
		}else{
			sql.append(" '合计' xcol, '合计' xcolDesc,");
		}
		//scol
		Object scolObj = chartJson.get("scol");
		if(scolObj != null){
			JSONObject scol = (JSONObject)scolObj;
			if(!scol.isNullObject() && !scol.isEmpty()){
				String tname = scol.getString("tableName");
				String tcol = scol.getString("tableColKey");
				String tcolName = scol.getString("tableColName");
				String id = scol.getString("id");
				//判断维度是否关联了码表
				if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
					//未关联码表
					boolean dyna = scol.getBoolean("dyna"); //是否动态列, 动态列采用 d_id 的 alias
					String incomeTable = scol.getString("tname");
					String str1 = dyna ? scol.getString("colname") : this.tableAlias.get(incomeTable)+"." + scol.getString("colname"); 
					sql.append(str1);
					sql.append(" ");
					sql.append(dyna ? "d_" + id :this.tableAlias.get(incomeTable)+"_" + scol.getString("colname"));
					sql.append(",");
					groupCols.add(str1);
					//scol 排序
					String ord = scol.getString("dimord");
					if(ord != null && ord.length() > 0 && !"null".equalsIgnoreCase(ord)){
						orderCols.add((dyna? "d_" + id : tableAlias.get(incomeTable)+"_"+ scol.getString("colname")) + "," + ord);
					}
				}else{
					//关联码表
					String str3 = this.tableAlias.get(tname)+"." + tcol;
					sql.append(str3);
					groupCols.add(str3);
					sql.append(" ");
					sql.append(this.tableAlias.get(tname)+"_" + tcol);
					sql.append(",");
					String str4 = this.tableAlias.get(tname)+"." + tcolName;
					sql.append(str4);
					groupCols.add(str4);
					sql.append(" ");
					sql.append(this.tableAlias.get(tname)+"_" + tcolName);
					sql.append(",");
					//scol 排序
					String sord = scol.getString("dimord");
					if(sord != null && sord.length() > 0 && !"null".equalsIgnoreCase(sord)){
						orderCols.add(tableAlias.get(tname)+"_"+tcol + "," + sord);
					}
				}
				//scol 过滤
				Object vals = scol.get("vals");
				if(vals != null && vals.toString().length() > 0 && !"null".equalsIgnoreCase(vals.toString())){
					filterCols.add(scol);
				}
				useTables.put((String)scol.get("tname"), null);
			}
		}
		//kpi
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			boolean calc = kpi.getBoolean("calc"); //判断是否是计算指标
			if(calc){
				sql.append(kpi.getString("col_name"));
			}else{
				sql.append(""+kpi.getString("aggre")+"(");
				sql.append(this.tableAlias.get(kpi.getString("tname"))+"." + kpi.getString("col_name"));
				sql.append(")");
			}
			/**
			String rate = kpi.getString("rate");
			if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
				sql.append("/"+rate);
			}
			**/
			sql.append(" ");
			sql.append(kpi.getString("alias"));
			sql.append(",");

			//格式化字段
			/**
			Object fmt = kpi.get("fmt");
			if(fmt != null && fmt.toString().length() > 0 && !"null".equalsIgnoreCase(fmt.toString())){
				sql.append("'" + fmt + "'");
				sql.append(" ");
				sql.append("kpi_fmt" + (i == 0 ?"":(i + 1)));
				sql.append(",");
			}
			**/
			//单位字段
			/**
			Object unit = kpi.get("unit");
			if(unit != null && unit.toString().length() > 0 && !"null".equalsIgnoreCase(unit.toString())){
				sql.append("'" + ChartService.formatUnits(kpi) + "'");
				sql.append(" ");
				sql.append("kpi_unit" + (i == 0 ?"":(i + 1)));
				sql.append(",");
			}
			**/
		}
		//去除逗号
		sql = new StringBuffer(sql.substring(0, sql.length() - 1));
		sql.append(" ");
		//判断数据集筛选会用到的表
		Object o = dsetJson.get("param");
		//判断查询条件会用到的表
		for(int i=0; i<paramJson.size(); i++){
			JSONObject p = paramJson.getJSONObject(i);
			String tname = p.getString("tname");
			useTables.put(tname, null);
		}
		//判断钻取会用到的表
		Object drill = chartJson.get("params");
		if(drill != null){
			JSONArray drills = (JSONArray)drill;
			for(int i=0; i<drills.size(); i++){
				JSONObject p = drills.getJSONObject(i);
				String tname = p.getString("tname");
				useTables.put(tname, null);
			}
		}
		String master = dsetJson.getString("master");
		sql.append(" from ");
		String aggreTable = (String)dsetJson.get("aggreTable");
		sql.append((aggreTable == null || aggreTable.length() == 0 ? master : aggreTable) + " " + tableAlias.get(master));

		for(int i=0; i<joinTabs.size(); i++){  //通过主表关联
			JSONObject tab = joinTabs.getJSONObject(i);
			String ref = tab.getString("ref");
			String refKey = tab.getString("refKey");
			String jtype = (String)tab.get("jtype");
			String force = (String)tab.get("force"); //是否强制链接
			if("y".equals(force) || useTables.containsKey(ref)){  //强制连接及已有表，进行关联
				if("left".equals(jtype) || "right".equals(jtype)){
					sql.append(" " + jtype);
				}
				sql.append(" join " + ref+ " " + tableAlias.get(ref));
				sql.append(" on a0."+tab.getString("col")+"="+tableAlias.get(ref)+"."+refKey);
				sql.append(" ");
			}
		}
		sql.append(" where 1=1 ");
		
		//数据权限控制筛选
		if(dataControl != null){
			String ret = dataControl.process(VDOPUtils.getLoginedUser(), tableAlias, dsetJson.getString("master"));
			if(ret != null){
				sql.append(ret+ " ");
			}
		}
		
		//添加筛选 (数据集的筛选)
		if(o != null){
			JSONArray params = (JSONArray)o;
			for(int i=0; i<params.size(); i++){
				JSONObject p = (JSONObject)params.get(i);
				String col = p.getString("col");
				String tname = p.getString("tname");
				String type = p.getString("type");
				String val = p.getString("val");
				if(val == null || val.length() == 0){
					continue;
				}
				String val2 = p.getString("val2");
				sql.append(" and "+tableAlias.get(tname)+"."+col);
				sql.append(type);
				if("string".equals(type)){
					sql.append(val);
				}else{
					sql.append("'");
					sql.append(val);
					sql.append("'");
				}
				if("between".equals(type)){
					sql.append(" and ");
					if("string".equals(type)){
						sql.append(val2);
					}else{
						sql.append("'");
						sql.append(val2);
						sql.append("'");
					}
				}
				sql.append(" ");
			}
		}
		//全局参数过滤
		for(int i=0; i<paramJson.size(); i++){
			filterCols.add(paramJson.getJSONObject(i));
		}
		
		//钻取过滤
		Object drillParam = chartJson.get("params");
		if(drillParam != null){
			JSONArray drills = (JSONArray)drillParam;
			for(int j=0; j<drills.size(); j++){
				filterCols.add(drills.getJSONObject(j));
			}
		}
		
		//处理过滤 (维度过滤 vals)
		for(JSONObject filter : filterCols){
			String val = (String)filter.get("vals");
			if(val == null || val.length() == 0 || "null".equalsIgnoreCase(val.toString())){
				continue;
			}
			boolean dyna = filter.getBoolean("dyna");
			String valType = filter.getString("valType");
			
			String tname = filter.getString("tableName");
			if(tname == null || tname.length() == 0 || dsetJson.getString("master").equals(tname)){
				tname = "a0";
			}else{
				tname = this.tableAlias.get(tname);
			}
			//判断筛选需要过滤的字段，如果设置了码表，采用码表的KEY字段
			String filterCol = filter.getString("colname");
			String tableColKey = (String)filter.get("tableColKey");
			if(tableColKey != null && tableColKey.length() > 0){
				filterCol = tableColKey;
			}
			//如果是dyna 动态列做过滤字段，不加前面的a0
			String col = (dyna ? "" :  tname + ".") + filterCol;
			//判断筛选值里是否有null
			if(val.indexOf(ExtConstants.NULLVAL) >= 0){
				if(val.split(",").length == 1 ){  
					sql.append("and " + col + " is null ");
				}else{
					sql.append("and (" + col + " is null or "+col+" in (" + VDOPUtils.dealStringParam(val, valType) +")) ");
				}
			}else{
				sql.append("and " + col + " in ("+VDOPUtils.dealStringParam(val, valType)+") ");
			}
		}
		//增加GROUP BY
		if(groupCols.size() > 0){
			sql.append("group by ");
			for(int i=0; i<groupCols.size(); i++){
				String col = groupCols.get(i);
				sql.append(col);
				if(i != groupCols.size() - 1){
					sql.append(",");
				}
			}
		}
		//处理指标筛选 (指标filter) 放在 datacenter 的 process 中
		/**
		StringBuffer filter = new StringBuffer("");
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			Object ftobj = kpi.get("filter");
			if(ftobj != null){
				JSONObject ft = (JSONObject)ftobj;
				filter.append(" and "+kpi.getString("alias")+" ");
				String tp = ft.getString("filterType");
				filter.append(tp);
				filter.append(" ");
				double val1 = ft.getDouble("val1");
				String kpiFmt = kpi.getString("fmt");
				if(kpiFmt != null && kpiFmt.length() > 0 && !"null".equalsIgnoreCase(kpiFmt) && kpiFmt.endsWith("%")){
					val1 = val1 / 100;
				}
				filter.append(val1);
				if("between".equals(tp)){
					double val2 = ft.getDouble("val2");
					if(kpiFmt != null && kpiFmt.length() > 0 && !"null".equalsIgnoreCase(kpiFmt) && kpiFmt.endsWith("%")){
						val2 = val2 / 100;
					}
					filter.append(" and " + val2);
				}
			}
		}
		if(filter.length() > 0){
			sql.append(" having 1=1 " + filter);
		}
		**/
		//增加order by 放在 datacenter 的 process 中
		/**
		if(orderCols.size() > 0){
			sql.append(" order by");
			for(int i=0; i<orderCols.size(); i++){
				String od = orderCols.get(i);
				sql.append(" ");
				sql.append(od);
				if(i != orderCols.size() - 1){
					sql.append(",");
				}
			}
		}
		**/
		String ret = sql.toString();
		//替换 ## 为 函数，##在velocity中为注释意思
		ret = ret.replaceAll("@", "'").replaceAll("##", "\\$extUtils.printJH()");
		return ret;
	}

	public Map<String, InputField> getMvParams() {
		return mvParams;
	}

	public void setMvParams(Map<String, InputField> mvParams) {
		this.mvParams = mvParams;
	}

	public Integer getXcolId() {
		return xcolId;
	}

	public void setXcolId(Integer xcolId) {
		this.xcolId = xcolId;
	}

	public Map<String, String> getTableAlias() {
		return tableAlias;
	}

	public void setTableAlias(Map<String, String> tableAlias) {
		this.tableAlias = tableAlias;
	}

	public JSONObject getChartJson() {
		return chartJson;
	}

	public JSONArray getKpiJson() {
		return kpiJson;
	}

	public JSONObject getDsourceJson() {
		return dsourceJson;
	}

	public JSONObject getDsetJson() {
		return dsetJson;
	}

	public void setChartJson(JSONObject chartJson) {
		this.chartJson = chartJson;
	}

	public void setKpiJson(JSONArray kpiJson) {
		this.kpiJson = kpiJson;
	}

	public void setDsourceJson(JSONObject dsourceJson) {
		this.dsourceJson = dsourceJson;
	}

	public void setDsetJson(JSONObject dsetJson) {
		this.dsetJson = dsetJson;
	}
	
	
}
