package com.ruisi.vdop.ser.ruisibi;

import java.math.BigDecimal;
import java.text.ParseException;
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
import com.ruisi.ext.engine.view.context.cross.CrossCols;
import com.ruisi.ext.engine.view.context.cross.CrossField;
import com.ruisi.ext.engine.view.context.cross.CrossReportContext;
import com.ruisi.ext.engine.view.context.cross.CrossReportContextImpl;
import com.ruisi.ext.engine.view.context.cross.CrossRows;
import com.ruisi.ext.engine.view.context.dc.grid.GridAccountContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridDataCenterContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridDataCenterContextImpl;
import com.ruisi.ext.engine.view.context.dc.grid.GridFilterContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridSetConfContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridShiftContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridSortContext;
import com.ruisi.ext.engine.view.context.dsource.DataSourceContext;
import com.ruisi.ext.engine.view.context.form.InputField;
import com.ruisi.ispire.dc.grid.GridFilter;
import com.ruisi.ispire.dc.grid.GridProcContext;
import com.ruisi.ispire.dc.grid.GridShift;
import com.ruisi.vdop.ser.cache.CacheDimVO;
import com.ruisi.vdop.ser.cache.CacheKeyVO;
import com.ruisi.vdop.ser.cache.CacheManager;
import com.ruisi.vdop.ser.division.DivisionQueryService;
import com.ruisi.vdop.ser.utils.DBUtils;
import com.ruisi.vdop.ser.utils.DataService;
import com.ruisi.vdop.util.VDOPUtils;

public class TableService {
	
	public final static String deftMvId = "mv.test.tmp";
	
	private Map<String, InputField> mvParams = new HashMap(); //mv的参数
	
	private Map<String, String> tableAlias = new HashMap<String, String>(); //表名称与别名的键值对
	
	private List<String> orderCols = new ArrayList<String>(); //需要进行排序的字段
	
	private DataControlInterface dataControl; //数据权限控制
	
	private JSONObject tableJson;
	private JSONArray kpiJson;
	private JSONObject dset;
	private JSONObject dsourceJson;
	
	/***
	 * 当指标有计算指标时，需要计算上期、同期等值，在显示数据时需要对偏移的数据进行过滤，
	 */
	private List<GridFilterContext> filters = new ArrayList<GridFilterContext>(); 
	
	public TableService(){
		String clazz = ExtContext.getInstance().getConstant("dataControl");
		if(clazz != null && clazz.length() != 0){
			try {
				dataControl = (DataControlInterface)Class.forName(clazz).newInstance();
			} catch (Exception e) {
				e.printStackTrace();
			} 
		}
	}
	
	public String createSql(JSONArray cacheKpi, JSONArray paramsJson, JSONObject divison) {
		//判断是否需要计算上期、同期值
		int jstype = this.getKpiComputeType(kpiJson);
		JSONArray joinTabs = dset.getJSONArray("joininfo");
		StringBuffer sb = new StringBuffer("select ");
		String kpiSort = null;
		Map<String, Object> useTables = new HashMap<String, Object>();  //此次查询使用的表,生成SQL时未选择的表不关联
		//查询指标
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			boolean calc = kpi.getBoolean("calc"); //判断是否是计算指标
			if(calc){
				sb.append(kpi.getString("col_name")); //不要tname 和 aggre
			}else{
				sb.append(kpi.getString("aggre") + "("+tableAlias.get(kpi.getString("tname"))+"."+kpi.getString("col_name")+") ");
			}
			sb.append(kpi.getString("alias"));
			sb.append(",");
			Object ks = kpi.get("sort");
			if(ks != null && !"".equals(ks.toString()) && !"null".equalsIgnoreCase(ks.toString())){
				kpiSort = kpi.getString("alias") + "," + ks;
			}
		}
		//查询未选择但是需要缓存的指标
		for(int i=0; cacheKpi!=null&&i<cacheKpi.size(); i++){
			JSONObject kpi = cacheKpi.getJSONObject(i);
			String alias = kpi.getString("alias");
			if(this.kpiExist(alias)){
				continue;
			}
			boolean calc = kpi.getBoolean("calc"); //判断是否是计算指标
			if(calc){
				sb.append(kpi.getString("col_name")); //不要tame 和 aggre
			}else{
				sb.append(kpi.getString("aggre") + "("+tableAlias.get(kpi.getString("tname"))+"."+kpi.getString("col_name")+") ");
			}
			sb.append(kpi.getString("alias"));
			sb.append(",");
		}
		
		List<String> groupCols = new ArrayList<String>(); //需要进行分组的字段
		List<JSONObject> filterCols = new ArrayList<JSONObject>(); //需要进行过滤的维度
		//查询行
		JSONArray cols = tableJson.getJSONArray("cols");
		for(int i=0; i<cols.size(); i++){
			JSONObject col = cols.getJSONObject(i);
			String type = col.getString("type");
			String id = col.getString("id");
			if("kpiOther".equals(type) && "kpi".equals(id)){
				continue;
			}
			String tname = col.getString("tableName");
			String tcol = col.getString("tableColKey");
			String tcolName = col.getString("tableColName");
			//判断维度是否关联了码表
			if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
				//未关联码表
				boolean dyna = col.getBoolean("dyna"); //是否动态列, 动态列采用 d_id 的 alias
				String incomeTable = col.getString("tname");
				String str1 = dyna ? col.getString("colname") :tableAlias.get(incomeTable) + "." +col.getString("colname");
				sb.append(str1);
				sb.append(" as " + (dyna ? "d_" + id : tableAlias.get(incomeTable) + "_" + col.getString("colname")));
				sb.append(",");
				groupCols.add(str1);
				
				String ord = col.getString("dimord");
				if(ord != null && ord.length() > 0 && !"null".equalsIgnoreCase(ord)){
					orderCols.add((dyna? "d_" + id : tableAlias.get(incomeTable)+"_"+ col.getString("colname")) + "," + ord);
				}
			}else{
				//关联了码表
				String str1 = tableAlias.get(tname)+"."+tcol;
				sb.append(str1);
				sb.append(" as " + tableAlias.get(tname) + "_" + tcol); //别名 + 列
				sb.append(",");
				String str2 = tableAlias.get(tname)+"."+tcolName;
				sb.append(str2);
				sb.append(" as " + tableAlias.get(tname)+"_"+tcolName);
				sb.append(",");
				
				String ord = col.getString("dimord");
				if(ord != null && ord.length() > 0 && !"null".equalsIgnoreCase(ord)){
					orderCols.add(tableAlias.get(tname)+"_"+ tcol + "," + ord);
				}
				groupCols.add(str1);
				groupCols.add(str2);
			}
			String vals = (String)col.get("vals");
			if(vals != null && vals.length() > 0){
				filterCols.add(col);
			}
			useTables.put((String)col.get("tname"), null); //已经使用的表
		}
		if(kpiSort != null){
			orderCols.add(kpiSort);
		}
		//查询列
		JSONArray rows = tableJson.getJSONArray("rows");
		for(int i=0; i<rows.size(); i++){
			JSONObject row = rows.getJSONObject(i);
			String type = row.getString("type");
			String id = row.getString("id");
			if("kpiOther".equals(type) && "kpi".equals(id)){
				continue;
			}
			String tname = row.getString("tableName");
			String tcol = row.getString("tableColKey");
			String tcolName = row.getString("tableColName");
			//判断维度是否关联了码表
			if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
				//未关联码表
				boolean dyna = row.getBoolean("dyna"); //是否动态列, 动态列采用 d_id 的 alias
				String incomeTable = row.getString("tname");
				String str1 = dyna ? row.getString("colname") :tableAlias.get(incomeTable) + "." +row.getString("colname");
				sb.append(str1);
				sb.append(" as " + (dyna ? "d_" + id : tableAlias.get(incomeTable) + "_" + row.getString("colname")));
				sb.append(",");
				groupCols.add(str1);
				
				String ord = row.getString("dimord");
				if(ord != null && ord.length() > 0 && !"null".equalsIgnoreCase(ord)){
					orderCols.add((dyna? "d_" + id : tableAlias.get(incomeTable)+"_"+ row.getString("colname")) + "," + ord);
				}
			}else{
				//关联了码表
				String str1 = tableAlias.get(tname)+"."+tcol;
				sb.append(str1);
				sb.append(" as " + tableAlias.get(tname) + "_" + tcol); //别名 + 列
				sb.append(",");
				String str2 = tableAlias.get(tname)+"."+tcolName;
				sb.append(str2);
				sb.append(" as " + tableAlias.get(tname)+"_"+tcolName);
				sb.append(",");
				
				String ord = row.getString("dimord");
				if(ord != null && ord.length() > 0 && !"null".equalsIgnoreCase(ord)){
					orderCols.add(tableAlias.get(tname)+"_"+ tcol + "," + ord);
				}
				groupCols.add(str1);
				groupCols.add(str2);
			}
			String vals = (String)row.get("vals");
			if(vals != null && vals.length() > 0){
				filterCols.add(row);
			}
			useTables.put((String)row.get("tname"), null); //已经使用的表
		}
		//去除逗号
		sb = new StringBuffer(sb.substring(0, sb.length() - 1));
		sb.append(" ");
		
		//查询条件会用到的表
		for(int i=0; paramsJson!=null&&i<paramsJson.size(); i++){
			JSONObject p = paramsJson.getJSONObject(i);
			useTables.put((String)p.get("tname"), null); 
		}
		
		String master = dset.getString("master");
		sb.append(" from ");
		//如果启用了分表， 此处表名不写, 在后面进行替换
		if(divison != null && !divison.isEmpty()){
			sb.append(" [tableName] " + tableAlias.get(master));
		}else{
			String aggreTable = (String)dset.get("aggreTable");
			sb.append((aggreTable == null || aggreTable.length() == 0 ? master : aggreTable)  + " " + tableAlias.get(master));
		}
		for(int i=0; i<joinTabs.size(); i++){  //通过主表关联
			JSONObject tab = joinTabs.getJSONObject(i);
			String ref = tab.getString("ref");
			String refKey = tab.getString("refKey");
			String jtype = (String)tab.get("jtype");
			String force = (String)tab.get("force"); //是否强制链接
			if("y".equals(force) || useTables.containsKey(ref)){  //强制连接及已有表，进行关联
				if("left".equals(jtype) || "right".equals(jtype)){
					sb.append(" " + jtype);
				}
				sb.append(" join " + ref+ " " + tableAlias.get(ref));
				sb.append(" on a0."+tab.getString("col")+"="+tableAlias.get(ref)+"."+refKey);
				sb.append(" ");
			}
		}
		
		sb.append(" where 1=1 ");
		
		//数据权限控制筛选
		if(dataControl != null){
			String ret = dataControl.process(VDOPUtils.getLoginedUser(), tableAlias, master);
			if(ret != null){
				sb.append(ret + " ");
			}
		}
		
		//数据集筛选
		Object o = dset.get("param");
		//添加筛选 (数据集的筛选)
		if(o != null){
			JSONArray params = (JSONArray)o;
			for(int i=0; i<params.size(); i++){
				JSONObject p = (JSONObject)params.get(i);
				String col = p.getString("col");
				String tname = p.getString("tname");
				String type = p.getString("type");
				String val = p.getString("val");
				String val2 = p.getString("val2");
				if(val == null || val.length() == 0){
					continue;
				}
				sb.append(" and "+tableAlias.get(tname)+"."+col);
				sb.append(type);
				if("string".equals(type)){
					sb.append(val);
				}else{
					sb.append("'");
					sb.append(val);
					sb.append("'");
				}
				if("between".equals(type)){
					sb.append(" and ");
					if("string".equals(type)){
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
		//全局参数过滤
		for(int i=0; i<paramsJson.size(); i++){
			filterCols.add(paramsJson.getJSONObject(i));
		}
		
		//处理过滤 (维度过滤 vals)
		for(JSONObject filter : filterCols){
			String val = filter.getString("vals");
			if(val == null || val.length() == 0){
				continue;
			}
			String type = filter.getString("type");
			Object gtp = filter.get("grouptype");
			String grouptype = gtp == null || gtp.toString().length() == 0 || "null".equalsIgnoreCase(gtp.toString()) ? "" : gtp.toString();
			if(jstype != 0 && "date".equals(grouptype)){
				String dateformat = (String)filter.get("dateformat"); 
				val = resetVals(val, type, dateformat, jstype);
			}
			String valType = filter.getString("valType");
			boolean dyna = filter.getBoolean("dyna");
			
			String tname = filter.getString("tableName");
			if(tname == null || tname.length() == 0 || dset.getString("master").equals(tname)){
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
			//动态字段不加表名
			String col = (dyna ? "" :  tname + ".") + filterCol;
			//判断筛选值里是否有null
			if(val.indexOf(ExtConstants.NULLVAL) >= 0){
				if(val.split(",").length == 1 ){  
					sb.append("and " + col + " is null ");
				}else{
					sb.append("and (" + col + " is null or "+col+" in (" + VDOPUtils.dealStringParam(val, valType) +")) ");
				}
			}else{
				sb.append("and " + col + " in ("+VDOPUtils.dealStringParam(val, valType)+") ");
			}
			
			//添加filter
			if(jstype != 0 && "date".equals(grouptype)){
				GridFilterContext gf = new GridFilterContext();
				gf.setColumn(this.getDimAlias(filter));
				gf.setFilterType(GridFilter.in);
				
				gf.setValue(filter.getString("vals"));
				
				this.filters.add(gf);
			}
		}
		//增加GROUP BY
		if(groupCols.size() > 0){
			sb.append("group by ");
			for(int i=0; i<groupCols.size(); i++){
				String col = groupCols.get(i);
				sb.append(col);
				if(i != groupCols.size() - 1){
					sb.append(",");
				}
			}
		}
		//处理指标筛选 (指标filter) 在process 中处理
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
				String rate = kpi.getString("rate");
				if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
					filter.append(" * " + rate);
				}
				if("between".equals(tp)){
					double val2 = ft.getDouble("val2");
					if(kpiFmt != null && kpiFmt.length() > 0 && !"null".equalsIgnoreCase(kpiFmt) && kpiFmt.endsWith("%")){
						val2 = val2 / 100;
					}
					filter.append(" and " + val2);
					if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
						filter.append(" * " + rate);
					}
				}
			}
		}
		if(filter.length() > 0){
			sb.append(" having 1=1 " + filter);
		}
		**/
		//增加order by
		//通过程序排序而不是sql
		/**
		if(orderCols.size() > 0){
			sb.append(" order by");
			for(int i=0; i<orderCols.size(); i++){
				String ord = orderCols.get(i);
				sb.append(" ");
				sb.append(ord);
				if(i != orderCols.size() - 1){
					sb.append(",");
				}
			}
		}
		**/
		return sb.toString().replaceAll("@", "'");
	}
	
	public CrossReportContext json2Table() throws ParseException{
		CrossReportContext ctx = new CrossReportContextImpl();
		
		CrossCols cols = new CrossCols();
		cols.setCols(new ArrayList<CrossField>());
		ctx.setCrossCols(cols);
		
		CrossRows rows = new CrossRows();
		rows.setRows(new ArrayList<CrossField>());
		ctx.setCrossRows(rows);
		
		//表格链接 先做
		//this.getTableRowLink(obj, ctx);
		
		JSONArray colsStr = tableJson.getJSONArray("cols");
		loopJsonField(colsStr, cols.getCols(), "col");
		
		JSONArray rowsStr = tableJson.getJSONArray("rows");
		loopJsonField(rowsStr, rows.getRows(),  "row");
		
		//如果没有维度，添加none维度
		if(cols.getCols().size() == 0){
			CrossField cf = new CrossField();
			cf.setType("none");
			cf.setDesc("合计");
			cols.getCols().add(cf);
		}
		if(rows.getRows().size() == 0){
			CrossField cf = new CrossField();
			cf.setType("none");
			cf.setDesc("合计");
			rows.getRows().add(cf);
		}
		
		//表格钻取维度
		//ctx.setDims(this.getDirllDim(sqlVO));
		
		return ctx;
	}
	
	public MVContext json2MV(JSONObject divison, JSONArray cacheKpi, JSONArray params, String cubeId) throws Exception{
		//先获取需要关联的表及表别名字段
		JSONArray joinTabs = dset.getJSONArray("joininfo");
		tableAlias.put(dset.getString("master"), "a0");
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
		
		//创建corssReport
		CrossReportContext cr = json2Table();
		//设置ID
		String id = ExtConstants.reportIdPrefix + IdCreater.create();
		cr.setId(id);
		cr.setOut("olap");
		cr.setShowData(true);
		
		//创建数据中心
		String sql = this.createSql(cacheKpi, params, divison);
		GridDataCenterContext dc = this.createDataCenter(divison, cacheKpi, sql, params, cubeId, dset.getString("master"));
		cr.setRefDataCetner(dc.getId());
		if(mv.getGridDataCenters() == null){
			mv.setGridDataCenters(new HashMap<String, GridDataCenterContext>());
		}
		mv.getGridDataCenters().put(dc.getId(), dc);
		
		mv.getChildren().add(cr);
		cr.setParent(mv);
		
		Map crs = new HashMap();
		crs.put(cr.getId(), cr);
		mv.setCrossReports(crs);
		
		//创建dataSource
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
			mv.setDsources(new HashMap());
		}
		mv.getDsources().put(dsource.getId(), dsource);
		
		return mv;
	}
	
	private CacheKeyVO createCacheKey(JSONArray params, String cubeId, String master){
		CacheKeyVO vo = new CacheKeyVO();
		List<CacheDimVO> dims = new ArrayList<CacheDimVO>();
		JSONArray cols = tableJson.getJSONArray("cols");
		for(int i=0; i<cols.size(); i++){
			JSONObject col = cols.getJSONObject(i);
			String type = col.getString("type");
			if("kpiOther".equalsIgnoreCase(type)){  //忽略指标
				continue;
			}
			CacheDimVO d = new CacheDimVO();
			d.setDimId(col.getString("id"));
			d.setValue((String)col.get("vals"));
			d.setOrd(col.getInt("ord"));
			dims.add(d);
		}
		JSONArray rows = tableJson.getJSONArray("rows");
		for(int i=0 ;i<rows.size(); i++){
			JSONObject row = rows.getJSONObject(i);
			CacheDimVO d = new CacheDimVO();
			d.setDimId(row.getString("id"));
			d.setValue((String)row.get("vals"));
			d.setOrd(row.getInt("ord"));
			dims.add(d);
		}
		//处理参数
		for(int i=0; params != null && i<params.size(); i++){
			JSONObject p = params.getJSONObject(i);
			CacheDimVO d = new CacheDimVO();
			d.setDimId(p.getString("id"));
			d.setValue((String)p.get("vals"));
			d.setOrd(p.getInt("ord"));
			dims.add(d);
		}
		vo.setCubeId(cubeId);
		vo.setCacheKey(dims);
		int jstype = this.getKpiComputeType(kpiJson);
		if(jstype != 0){
			vo.setJstype(jstype);
		}
		//数据权限控制, 作为key的一部分
		if(dataControl != null){
			String ret = dataControl.process(VDOPUtils.getLoginedUser(), tableAlias, master);
			vo.setDataControlKey(ret);
		}
		
		return vo;
	}
	
	/**
	 * 创建表格datacenter
	 * @param sql
	 * @return
	 * @throws Exception 
	 */
	public GridDataCenterContext createDataCenter(JSONObject divison, JSONArray cacheKpi, String sql, JSONArray params, String cubeId, String master) throws Exception{
		GridDataCenterContext ctx = new GridDataCenterContextImpl();
		GridSetConfContext conf = new GridSetConfContext();
		conf.setRefDsource(dsourceJson.getString("dsid"));
		
		if(cubeId != null && cubeId.length() > 0){  //只有cubeId 存在的时候才启用缓存，不然不启动缓存
			//判断是否有缓存，如果有直接读取缓存对象
			CacheManager.createInstance(VDOPUtils.getServletContext());
			CacheKeyVO keyvo = this.createCacheKey(params, cubeId, master);
			List dt = CacheManager.getInstance().getCache(keyvo);
			if(dt == null){
				//创建缓存
				if(divison != null && !divison.isEmpty()){ 
					//是否分表，如果启用分表，进行多线程查询
					if(cacheKpi != null && !cacheKpi.isEmpty()){
						kpiJson.addAll(cacheKpi);
					}
					DivisionQueryService ser = new DivisionQueryService(sql, dsourceJson, divison, master, kpiJson);
					dt = ser.process();
				}else{
					DataService ser = new DataService();
					DataService.RSDataSource rsds = ser.json2datasource(dsourceJson);
					dt = DBUtils.querySql(sql, rsds);
				}
				CacheManager.getInstance().putCache(keyvo, dt);
			}
			VDOPUtils.getRequest().setAttribute("dt", dt);
			conf.setDataKey("dt");
		}else{ //不启用缓存
			if(divison != null && !divison.isEmpty()){ 
				//是否分表，如果启用分表，进行多线程查询
				if(cacheKpi != null && !cacheKpi.isEmpty()){
					kpiJson.addAll(cacheKpi);
				}
				DivisionQueryService ser = new DivisionQueryService(sql, dsourceJson, divison, master, kpiJson);
				List dt = ser.process();
				VDOPUtils.getRequest().setAttribute("dt", dt);
				conf.setDataKey("dt");
			}else{  //普通查询
				String name = TemplateManager.getInstance().createTemplate(sql);
				conf.setTemplateName(name);
			}
		}
		ctx.setConf(conf);
		ctx.setId("DC-" + IdCreater.create());
		
		//判断指标计算
		
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			String compute = (String)kpi.get("compute");
			if(compute != null && compute.length() > 0){
				if("zb".equals(compute)){
					GridProcContext proc = this.createAccount( kpi);
					ctx.getProcess().add(proc);
				}else{
					String[] jss = compute.split(",");
					for(String js : jss){
						GridProcContext proc = this.createShift(kpi, js);
						ctx.getProcess().add(proc);
					}
				}
			}
		}
		//判断是否有时间偏移的计算
		for(GridFilterContext filter : this.filters){
			ctx.getProcess().add(filter);
		}
		
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
	
	/**
	 * 创建时间偏移process,时间偏移用来计算同比、环比、上期、同期等值
	 * @param sqlVO
	 * @param kpi
	 * @return
	 */
	private GridProcContext createShift(JSONObject kpi, String compute){
		//查询最小时间维度
		int minDate = 4;
		JSONObject minDim = null;
		JSONArray cols = tableJson.getJSONArray("cols");
		JSONArray rows = tableJson.getJSONArray("rows");
		for(int i=0; i<cols.size() + rows.size(); i++){
			JSONObject col;
			if(i<cols.size()){
				col = cols.getJSONObject(i);
			}else{
				col = rows.getJSONObject(i - cols.size());
			}
			String tp = col.getString("type");
			if("frd".equalsIgnoreCase(tp) || "kpiOther".equalsIgnoreCase(tp)){
				continue;
			}
			int curDate = ChartService.type2value(tp);
			if(curDate <= minDate){
				minDate = curDate;
				minDim = col;
			}
		}
		GridShiftContext proc = new GridShiftContext();
		String type = minDim.getString("type");
		proc.setDateType(type);
		proc.setDateColumn(this.getDimAlias(minDim));
		proc.setComputeType(compute);
		proc.setKpiColumn(new String[]{kpi.getString("alias")});
		proc.setDateFormat((String)minDim.get("dateformat"));
		//设置过滤维度
		StringBuffer sb = new StringBuffer("");
		for(int i=0; i<cols.size() + rows.size(); i++){
			JSONObject col;
			if(i<cols.size()){
				col = cols.getJSONObject(i);
			}else{
				col = rows.getJSONObject(i - cols.size());
			}
			String tp = col.getString("type");
			if("year".equals(tp) || "quarter".equals(tp) || "month".equals(tp) || "day".equals(tp) || "kpiOther".equals(tp)){
				continue;
			}
			sb.append(this.getDimAlias(col));
			sb.append(",");
		}
		if(sb.length() > 0){
			String str = sb.substring(0, sb.length() - 1);
			proc.setKeyColumns(str.split(","));
		}
		return proc;
	}
	
	/**
	 * 创建占比计算process
	 */
	private GridProcContext createAccount(JSONObject kpi){
		GridAccountContext proc = new GridAccountContext();
		proc.setColumn(kpi.getString("alias"));
		JSONArray cols = tableJson.getJSONArray("cols");
		//创建计算的分组维
		StringBuffer sb = new StringBuffer("");
		for(int i=0; i<cols.size(); i++){
			JSONObject col = cols.getJSONObject(i);
			String tp = col.getString("type");
			if("kpiOther".equals(tp)){
				continue;
			}
			sb.append(this.getDimAlias(col));
		}
		JSONArray rows = tableJson.getJSONArray("rows");
		for(int i=0; i<rows.size(); i++){
			JSONObject row = rows.getJSONObject(i);
			if(i == rows.size() - 1){
				//剔除row 最后一个维度
			}else{
				sb.append(this.getDimAlias(row));
			}
			
		}
		if(sb.length() > 0){
			String str = sb.substring(0, sb.length() - 1);
			proc.setGroupDim(str.split(","));
		}
		return proc;
	}
	
	private void loopJsonField(JSONArray arrays, List<CrossField> ls, String pos) throws ParseException{
		List<CrossField> tmp = ls;
		for(int i=0; i<arrays.size(); i++){
			JSONObject obj = arrays.getJSONObject(i);
			String type = obj.getString("type");
			String issum = (String)obj.get("issum");
			String casparent = (String)obj.get("iscas");
			
			if(type.equals("kpiOther")){
				
				List<CrossField> newCf = new ArrayList<CrossField>();
				if(tmp.size() == 0){
					for(int j=0; j<kpiJson.size(); j++){
						JSONObject kpi = kpiJson.getJSONObject(j);
						CrossField cf = new CrossField();
						cf.setType(type);
						cf.setAggregation(kpi.getString("aggre"));
						cf.setAlias(kpi.getString("alias"));
						cf.setFormatPattern((String)kpi.get("fmt"));
						cf.setSubs(new ArrayList<CrossField>());
						//用 size来表示指标ID，用在OLAP中
						cf.setId(kpi.getString("kpi_id"));
						String rate = kpi.getString("rate");
						if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
							cf.setKpiRate(new BigDecimal(rate));
						}
						String unit = this.writerUnit(cf.getKpiRate()) +(kpi.get("unit")==null?"":kpi.get("unit"));
						cf.setDesc(kpi.getString("kpi_name") + (unit != null && unit.length() > 0 ?"(" + unit + ")":""));  //指标名称+ 单位
						tmp.add(cf);
						newCf.add(cf);
						//判断指标是否需要进行计算
						String compute = (String)kpi.get("compute");
						if(compute != null && compute.length() > 0){
							String[] jss = compute.split(",");  //可能有多个计算，用逗号分隔
							for(String js : jss){
								CrossField ret = this.kpiCompute(js, kpi);
								tmp.add(ret);
								newCf.add(ret);
							}
						}
					}
				}else{
					for(CrossField tp : tmp){
						for(int j=0; j<kpiJson.size(); j++){
							JSONObject kpi = kpiJson.getJSONObject(j);
							CrossField cf = new CrossField();
							cf.setType(type);
							cf.setDesc(kpi.getString("kpi_name"));
							cf.setAggregation(kpi.getString("aggre"));
							cf.setAlias(kpi.getString("alias"));
							cf.setFormatPattern((String)kpi.get("fmt"));
							cf.setSubs(new ArrayList<CrossField>());
							//用 size来表示指标ID，用在OLAP中
							cf.setId(kpi.getString("kpi_id"));
							String rate = kpi.getString("rate");
							if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
								cf.setKpiRate(new BigDecimal(rate));
							}
							String unit = this.writerUnit(cf.getKpiRate()) +(kpi.get("unit")==null?"":kpi.get("unit"));
							cf.setDesc(kpi.getString("kpi_name") + (unit != null && unit.length() > 0 ?"(" + unit + ")":""));  //指标名称+ 单位
							tp.getSubs().add(cf);
							newCf.add(cf);
							//判断指标是否需要进行计算
							String compute = (String)kpi.get("compute");
							if(compute != null && compute.length() > 0){
								String[] jss = compute.split(",");  //可能有多个计算，用逗号分隔
								for(String js : jss){
									CrossField cp = this.kpiCompute(js, kpi);
									tp.getSubs().add(cp);
									newCf.add(cp);
								}
							}
						}
					}
				}
				tmp = newCf;
				
			}else {
				List<CrossField> newCf = new ArrayList<CrossField>();
				if(tmp.size() == 0){
					CrossField cf = new CrossField();
					cf.setType("frd");
					String dateformat = (String)obj.get("dateformat");
					if("day".equals(type)){
						cf.setDateType("day");
						cf.setDateTypeFmt(dateformat);
					}else if("month".equals(type)){
						cf.setDateType("month");
						cf.setDateTypeFmt(dateformat);
					}
					cf.setId(obj.get("id").toString());
					cf.setDesc(obj.getString("dimdesc"));
					String tname = obj.getString("tableName");
					String tcol = obj.getString("tableColKey");
					String tcolName = obj.getString("tableColName");
					boolean dyna = obj.getBoolean("dyna");
					//判断维度是否关联了码表
					if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
						//未关联码表
						if(dyna){
							cf.setAlias("d_" + cf.getId());
							cf.setAliasDesc(cf.getAlias());
						}else{
							cf.setAlias(this.tableAlias.get(obj.getString("tname")) + "_" + obj.getString("colname")); //来源表名+列
							cf.setAliasDesc(cf.getAlias()); //来源表名+列
						}
					}else{
						//关联码表
						cf.setAlias(this.tableAlias.get(obj.getString("tableName")) + "_" + obj.getString("tableColKey")); //别名+列
						cf.setAliasDesc(this.tableAlias.get(obj.getString("tableName")) + "_" + obj.getString("tableColName")); //别名+列
					}
					if("y".equals(casparent)){
						cf.setCasParent(true);
					}
					cf.setValue((String)obj.get("vals"));
					cf.setMulti(true);
					cf.setSubs(new ArrayList<CrossField>());			
					tmp.add(cf);
					newCf.add(cf);
					
					//添加合计项
					if("y".equals(issum)){
						CrossField sumcf = new CrossField();
						sumcf.setType("none");
						sumcf.setDimAggre((String)obj.get("aggre"));
						sumcf.setDesc(MyCrossFieldLoader.loadFieldName(sumcf.getDimAggre()));
						sumcf.setSubs(new ArrayList<CrossField>());		
						tmp.add(sumcf);
						newCf.add(sumcf);
					}
					
				}else{
					for(CrossField tp : tmp){
						//如果上级是合计，下级不包含维度了, 但需要包含指标
						if(tp.getType().equals("none")){
							
							//如果是col,需要给合计添加指标
							if(pos.equals("col")){
								for(int j=0; j<kpiJson.size(); j++){
									JSONObject kpi = kpiJson.getJSONObject(j);
									CrossField kpicf = new CrossField();
									kpicf.setType("kpiOther");
									//kpicf.setDesc(kpi.getString("kpi_name"));
									kpicf.setAggregation(kpi.getString("aggre"));
									kpicf.setAlias(kpi.getString("alias"));
									kpicf.setFormatPattern((String)kpi.get("fmt"));
									kpicf.setSubs(new ArrayList<CrossField>());
									//用 size来表示指标ID，用在OLAP中
									kpicf.setId(kpi.getString("kpi_id"));
									String rate = kpi.getString("rate");
									if(rate != null && rate.length() > 0 && !"null".equalsIgnoreCase(rate)){
										kpicf.setKpiRate(new BigDecimal(rate));
									}
									kpicf.setDesc(kpi.getString("kpi_name") + "("  + this.writerUnit(kpicf.getKpiRate()) +kpi.get("unit") + ")");  //指标名称+ 单位
									tp.getSubs().add(kpicf);
									kpicf.setParent(tp);
								}
							}
							
							continue;
						}
						String dateformat = (String)obj.get("dateformat");
						CrossField cf = new CrossField();
						cf.setType("frd");
						if("day".equals(type)){
							cf.setDateType("day");
							cf.setDateTypeFmt(dateformat);
						}else if("month".equals(type)){
							cf.setDateType("month");
							cf.setDateTypeFmt(dateformat);
						}
						cf.setId(obj.get("id").toString());
						cf.setDesc(obj.getString("dimdesc"));
						String tname = obj.getString("tableName");
						String tcol = obj.getString("tableColKey");
						String tcolName = obj.getString("tableColName");
						boolean dyna = obj.getBoolean("dyna");
						//判断维度是否关联了码表
						if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
							//未关联码表
							if(dyna){
								cf.setAlias("d_" + cf.getId()); //d + 维度ID
								cf.setAliasDesc(cf.getAlias());
							}else{
								cf.setAlias(this.tableAlias.get(obj.getString("tname")) + "_" + obj.getString("colname")); //来源表名+列
								cf.setAliasDesc(this.tableAlias.get(obj.getString("tname")) + "_" + obj.getString("colname")); //来源表名+列
							}
						}else{
							//关联码表
							cf.setAlias(this.tableAlias.get(obj.getString("tableName")) + "_" + obj.getString("tableColKey")); //别名+列
							cf.setAliasDesc(this.tableAlias.get(obj.getString("tableName")) + "_" + obj.getString("tableColName")); //别名+列
						}
						if("y".equals(casparent)){
							cf.setCasParent(true);
						}
						cf.setValue((String)obj.get("vals"));
						cf.setMulti(true);
						cf.setSubs(new ArrayList<CrossField>());
						cf.setParent(tp);
						tp.getSubs().add(cf);
						newCf.add(cf);
						
						//添加合计项
						if("y".equals(issum)){
							CrossField sumcf = new CrossField();
							sumcf.setType("none");
							sumcf.setDimAggre((String)obj.get("aggre"));
							sumcf.setDesc(MyCrossFieldLoader.loadFieldName(sumcf.getDimAggre()));
							sumcf.setSubs(new ArrayList<CrossField>());		
							tp.getSubs().add(sumcf);
							newCf.add(sumcf);
						}
					}
				}
				tmp = newCf;
			}
			
		}
	}	
	
	//输出单位比例
	public String writerUnit(BigDecimal bd){
		if(bd == null){
			return "";
		}else{
			int v = bd.intValue();
			if(v == 1){
				return "";
			}else if(v == 100){
				return "百";
			}else if(v == 1000){
				return "千";
			}else if(v == 10000){
				return "万";
			}else if(v == 1000000){
				return "百万";
			}else if(v == 100000000){
				return "亿";
			}else{
				return "*" + v;
			}
		}
	}
	
	private CrossField kpiCompute(String compute, JSONObject kpi){
		String alias = (String)kpi.get("alias");
		CrossField cf = new CrossField();
		if("zb".equals(compute)){
			cf.setDesc("占比");
			cf.setAggregation("avg");
			cf.setAlias(alias + "_zb");
			cf.setFormatPattern("0.00%");
		}else if("sq".equals(compute)){
			cf.setDesc("上期值");
			cf.setAggregation(kpi.getString("aggre"));
			cf.setAlias(alias+"_sq");
			cf.setFormatPattern((String)kpi.get("fmt"));
		}else if("tq".equals(compute)){
			cf.setDesc("同期值");
			cf.setAggregation(kpi.getString("aggre"));
			cf.setAlias(alias+"_tq");
			cf.setFormatPattern((String)kpi.get("fmt"));
		}else if("zje".equals(compute)){
			cf.setDesc("增减额");
			cf.setAggregation(kpi.getString("aggre"));
			cf.setAlias(alias + "_zje");
			cf.setFormatPattern((String)kpi.get("fmt"));
			cf.setFinanceFmt(true);
		}else if("hb".equals(compute)){
			cf.setDesc("环比");
			cf.setAggregation("avg");
			cf.setAlias(alias + "_hb");
			cf.setFormatPattern("0.00%");
			cf.setFinanceFmt(true);
		}else if("tb".equals(compute)){
			cf.setDesc("同比");
			cf.setAggregation("avg");
			cf.setAlias(alias+"_tb");
			cf.setFormatPattern("0.00%");
			cf.setFinanceFmt(true);
		}
		cf.setType("kpiOther");
		cf.setId("ext_" + kpi.getString("kpi_id")+"_"+compute); //表示当前指标是由基本指标衍生而来，比如昨日、累计、同比、环比、排名、占比等内容。
		return cf;
	}
	
	private boolean kpiExist(String alias){
		boolean ret = false;
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			String a = kpi.getString("alias");
			if(alias.equals(a)){
				ret = true;
				break;
			}
		}
		return ret;
	}
	
	/**
	 * 根据维度json对象，获取维度在数据库中对应的字段名称
	 * @param dim
	 * @return
	 */
	private String getDimAlias(JSONObject obj){
		boolean dyna = obj.getBoolean("dyna");
		String tname = obj.getString("tableName");
		String tcol = obj.getString("tableColKey");
		String tcolName = obj.getString("tableColName");
		String ret = null;
		//判断维度是否关联了码表
		if(tname == null || tname.length() == 0 || tcol == null || tcol.length() == 0 || tcolName == null || tcolName.length() == 0){
			//未关联码表
			if(dyna){
				ret = ("d_" + obj.getString("id"));
			}else{
				ret = (this.tableAlias.get(obj.getString("tname")) + "_" + obj.getString("colname")); //来源表名+列
			}
		}else{
			//关联码表
			ret = (this.tableAlias.get(obj.getString("tableName")) + "_" + obj.getString("tableColKey")); //别名+列
		}
		return ret;
	}
	
	/**
	 * 获取kpi的计算方式，是计算上期值、还是计算同期值、还是都计算
	 * 
	 * @return 返回 0(都不计算)，1（上期值）, 2（同期值）, 3 （都计算） 
	 */
	public int getKpiComputeType(JSONArray kpis){
		boolean sq = false;
		boolean tq = false;
		for(int i=0; i<kpis.size(); i++){
			String compute = (String)kpis.getJSONObject(i).get("compute");
			if(compute != null && compute.length() > 0){
				String[] jss = compute.split(",");
				for(String js : jss){
					if("sq".equals(js) || "zje".equals(js) || "hb".equals(js)){
						sq = true;
					}else if("tq".equals(js) || "tb".equals(js)){
						tq = true;
					}
				}
			}
		}
		if(sq && tq){
			return 3;
		}else if(sq){
			return 1;
		}else if(tq){
			return 2;
		}else{
			return 0;
		}
	}
	
	/**
	 * 根据指标计算的值筛选，从新设置时间字段的值列表
	 */
	public static String resetVals(String inputval, String type, String dateFormat, int jstype){
		String dateformat = dateFormat;
		if(jstype == 0){
			return inputval;
		}
		String[] vals = inputval.split(",");
		List<String> rets = new ArrayList<String>();
		for(String val : vals){
			//先添加他自己
			if(!rets.contains(val)){
				rets.add(val);
			}
			if(jstype == 1 || jstype == 3){ //上期
				String nval = GridShift.getDateShiftValue(val, type, dateformat, "sq");
				if(!rets.contains(nval)){
					rets.add(nval);
				}
			}
			if(jstype == 2 || jstype == 3){ //同期
				String nval = GridShift.getDateShiftValue(val, type, dateformat, "tq");
				if(!rets.contains(nval)){
					rets.add(nval);
				}
			}
		}
		return list2String(rets);
	}
	
	private static String list2String(List<String> rets){
		StringBuffer sb = new StringBuffer();
		for(int i=0; i<rets.size(); i++){
			String ret = rets.get(i);
			sb.append(ret);
			if(i != rets.size() - 1){
				sb.append(",");
			}
		}
		return sb.toString();
	}

	public Map<String, InputField> getMvParams() {
		return mvParams;
	}

	public void setMvParams(Map<String, InputField> mvParams) {
		this.mvParams = mvParams;
	}

	public Map<String, String> getTableAlias() {
		return tableAlias;
	}

	public void setTableAlias(Map<String, String> tableAlias) {
		this.tableAlias = tableAlias;
	}

	public JSONObject getTableJson() {
		return tableJson;
	}

	public JSONArray getKpiJson() {
		return kpiJson;
	}

	public JSONObject getDset() {
		return dset;
	}

	public JSONObject getDsourceJson() {
		return dsourceJson;
	}

	public void setTableJson(JSONObject tableJson) {
		this.tableJson = tableJson;
	}

	public void setKpiJson(JSONArray kpiJson) {
		this.kpiJson = kpiJson;
	}

	public void setDset(JSONObject dset) {
		this.dset = dset;
	}

	public void setDsourceJson(JSONObject dsourceJson) {
		this.dsourceJson = dsourceJson;
	}

}
