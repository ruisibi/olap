package com.ruisi.vdop.ser.ruisibi;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.ruisi.ext.engine.init.TemplateManager;
import com.ruisi.ext.engine.view.context.Element;
import com.ruisi.ext.engine.view.context.chart.ChartContext;
import com.ruisi.ext.engine.view.context.chart.ChartKeyContext;
import com.ruisi.ext.engine.view.context.cross.CrossField;
import com.ruisi.ext.engine.view.context.cross.CrossKpi;
import com.ruisi.ext.engine.view.context.cross.CrossReportContext;
import com.ruisi.ext.engine.view.context.dc.grid.AggreVO;
import com.ruisi.ext.engine.view.context.dc.grid.GridAggregationContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridDataCenterContext;
import com.ruisi.ext.engine.view.context.dc.grid.GridSortContext;
import com.ruisi.ext.engine.view.context.dsource.DataSourceContext;
import com.ruisi.ext.engine.view.context.gridreport.GridCell;
import com.ruisi.ext.engine.view.context.gridreport.GridReportContext;
import com.ruisi.ext.engine.view.context.html.DataContext;
import com.ruisi.ext.engine.view.context.html.DivContext;
import com.ruisi.ext.engine.view.context.html.TextContext;
import com.ruisi.ext.engine.view.context.html.TextProperty;
import com.ruisi.ispire.dc.grid.GridProcContext;


public class ReportXMLService {
	
	public void createText(StringBuffer sb, TextContext text) throws IOException{
		sb.append("<text");
		TextProperty pp = text.getTextProperty();
		if(pp != null){
			if(pp.getAlign() != null && pp.getAlign().length() > 0){
				sb.append(" align=\""+pp.getAlign()+"\"");
			}
			if(pp.getSize() != null && pp.getSize().length() > 0){
				sb.append(" size=\""+pp.getSize()+"\"");
			}
			if(pp.getHeight() != null && pp.getHeight().length() > 0){
				sb.append(" height=\""+pp.getHeight()+"\"");
			}
			if(pp.getWeight() != null && pp.getWeight().length() > 0){
				sb.append(" weight=\""+pp.getWeight()+"\"");
			}
			if(pp.getColor() != null && pp.getColor().length() > 0){
				sb.append(" color=\""+pp.getColor()+"\"");
			}
		}
		sb.append(">");
		if(text.getTemplateName() != null && text.getTemplateName().length() > 0){
			String txt = TemplateManager.getInstance().getTemplate(text.getTemplateName());
			sb.append("<template><![CDATA["+txt.replaceAll("\n", "<br/>")+"]]></template>");
		}else{
			sb.append("<![CDATA[ "+text.getText().replaceAll("\n", "<br/>")+" ]]>");
		}
		sb.append("</text>");
	}
	
	private void copyGridReportCell(StringBuffer sb, GridCell cell){
		sb.append("<cell ");
		if(cell.getColSpan() != 0 && cell.getColSpan() != 1){
			sb.append(" colSpan=\""+cell.getColSpan()+"\"");
		}
		if(cell.getRowSpan() != 0 && cell.getRowSpan() != 1){
			sb.append(" rowSpan=\""+cell.getRowSpan()+"\"");
		}
		if(cell.getDesc() != null && cell.getDesc().length() > 0){
			sb.append(" desc=\""+cell.getDesc()+"\" ");
		}
		if(cell.getAlign() != null && cell.getAlign().length() > 0){
			sb.append(" align=\""+cell.getAlign()+"\"");
		}
		if(cell.getDynamicText() != null && cell.getDynamicText()){
			sb.append(" dynamicText=\"true\"");
		}
		if(cell.getAlias() != null && cell.getAlias().length() > 0){
			sb.append(" alias=\""+cell.getAlias()+"\"");
		}
		if(cell.getFormatPattern() != null && cell.getFormatPattern().length() > 0){
			sb.append(" formatPattern=\""+cell.getFormatPattern()+"\"");
		}
		if(cell.isOrder()){
			sb.append(" order=\""+cell.isOrder()+"\"");
		}
		if(cell.isFinanceFmt()){
			sb.append(" financeFmt=\""+cell.isFinanceFmt()+"\"");
		}
		sb.append("/>");
	}
	
	public void createData(StringBuffer sb, DataContext data) throws IOException{
		sb.append("<data key=\""+data.getKey()+"\"");
		if(data.getRefDsource() != null && data.getRefDsource().length() > 0){
			sb.append(" refDsource=\""+data.getRefDsource()+"\"");
		}
		sb.append("><![CDATA[");
		String sql = TemplateManager.getInstance().getTemplate(data.getTemplateName());
		sb.append(sql);
		sb.append("]]></data>");
	}
	
	public void createDiv(StringBuffer sb, DivContext div) throws IOException{
		sb.append("<div");
		if(div.getId() != null && div.getId().length() > 0){
			sb.append(" id=\""+div.getId()+"\"");
		}
		if(div.getAlign() != null && div.getAlign().length() > 0){
			sb.append(" align=\""+div.getAlign()+"\"");
		}
		if(div.getStyleClass() != null && div.getStyleClass().length() > 0){
			sb.append(" styleClass=\""+div.getStyleClass()+"\"");
		}
		if(div.getStyle() != null && div.getStyle().length() > 0){
			sb.append(" style=\""+div.getStyle()+"\"");
		}
		sb.append(">");
		if(div.getChildren() != null){
			List<Element> ls = div.getChildren();
			for(Element tdcldo : ls){
				if(tdcldo instanceof TextContext){
					this.createText(sb, (TextContext)tdcldo);
				}else if(tdcldo instanceof CrossReportContext){
					this.createCrossReport(sb, (CrossReportContext)tdcldo);
				}else if(tdcldo instanceof ChartContext){
					this.createChart(sb, (ChartContext)tdcldo);
				}else if(tdcldo instanceof GridReportContext){
					this.createGridReport(sb, (GridReportContext)tdcldo);
				}else if(tdcldo instanceof DivContext){
					this.createDiv(sb, (DivContext)tdcldo);
				}
			}
		}
		sb.append("</div>");
	}
	
	public void createGridReport(StringBuffer sb, GridReportContext gd){
		sb.append("<gridReport>");
		sb.append("<header>");
		for(int i=0; i<gd.getHeaders().length; i++){
			sb.append("<row>");
			for(int j=0; j<gd.getHeaders()[i].length; j++){
				GridCell cell = gd.getHeaders()[i][j];
				copyGridReportCell(sb, cell);
			}
			sb.append("</row>");
		}
		sb.append("</header>");

		sb.append("<detail>");
		for(int i=0; i<gd.getDetails().length; i++){
			sb.append("<row>");
			for(int j=0; j<gd.getDetails()[i].length; j++){
				GridCell cell = gd.getDetails()[i][j];
				copyGridReportCell(sb, cell);
			}
			sb.append("</row>");
		}
		sb.append("</detail>");
		
		sb.append("<footer>");
		for(int i=0; i<gd.getFooters().length; i++){
			sb.append("<row>");
			for(int j=0; j<gd.getFooters()[i].length; j++){
				GridCell cell = gd.getFooters()[i][j];
				copyGridReportCell(sb, cell);
			}
			sb.append("</row>");
		}
		sb.append("</footer>");
		
		sb.append("<ds ");
		if(gd.getPageInfo() != null && gd.getPageInfo().getPagesize() != 0){
			sb.append(" pageSize=\""+gd.getPageInfo().getPagesize()+"\"");
		}
		if(gd.getRefDataCenter() != null && gd.getRefDataCenter().length() > 0){
			sb.append(" refDataCenter=\""+gd.getRefDataCenter()+"\"");
		}
		if(gd.getRefDsource() != null && gd.getRefDsource().length() > 0){
			sb.append(" refDsource=\""+gd.getRefDsource()+"\"");
		}
		sb.append("></ds>");
		
		sb.append("</gridReport>");
	}
	
	private String array2String(String[] vals){
		String ret = "";
		for(int i=0; i<vals.length; i++){
			String val = vals[i];
			ret += val;
			if(i != vals.length - 1){
				ret += ",";
			}
		}
		return ret;
	}
	
	public void createDataCenter(StringBuffer sb, Map<String, GridDataCenterContext> dataCenters) throws IOException{
		if(dataCenters == null || dataCenters.size() == 0){
			return;
		}
		for(Map.Entry<String, GridDataCenterContext> dataCenter : dataCenters.entrySet()){
			GridDataCenterContext gdc = dataCenter.getValue();
			sb.append("<gridDataCenter id=\""+gdc.getId()+"\">");
			sb.append("<ds "+(gdc.getConf().getRefDsource() != null ? "refDsource=\""+gdc.getConf().getRefDsource()+"\"":"")+"><![CDATA[");
			String sql = TemplateManager.getInstance().getTemplate(gdc.getConf().getTemplateName());
			sb.append(sql);
			sb.append("]]></ds>");
			List<GridProcContext> process = gdc.getProcess();
			if(process != null && process.size() > 0){
				sb.append("<processor>");
				for(GridProcContext proc : process){
					//聚合项
					if(proc instanceof GridAggregationContext){
						GridAggregationContext agg = (GridAggregationContext)proc;
						sb.append("<aggregation");
						if(agg.getColumn() != null){
							sb.append(" column=\""+array2String(agg.getColumn())+"\"");
						}
						if(agg.isToExt()){
							sb.append(" toExt=\"true\"");
						}
						sb.append(">");
						AggreVO[] avo = agg.getAggreVO();
						for(AggreVO vo : avo){
							sb.append("<aggreConfig ");
							if(vo.getType() != null){
								sb.append(" type=\""+vo.getType()+"\"");
							}
							if(vo.getName() != null){
								sb.append(" name=\""+vo.getName()+"\"");
							}
							if(vo.getAlias() != null){
								sb.append(" alias=\""+vo.getAlias()+"\"");
							}
							if(vo.getExpression() != null && vo.getExpression()){
								sb.append(" expression=\"true\" ");
							}
							sb.append(" />");
						}
						sb.append("</aggregation>");
					}
					//排序
					if(proc instanceof GridSortContext){
						GridSortContext sort = (GridSortContext)proc;
						sb.append("<sort column=\""+sort.getColumn()+"\" type=\""+sort.getType()+"\"/>");
					}
				}
				
				sb.append("</processor>");
			}
			sb.append("</gridDataCenter>");
		}
	}
	
	public void createDataSource(StringBuffer sb, Map<String, DataSourceContext> dsource){
		if(dsource == null || dsource.size() == 0){
			return;
		}
		for(Map.Entry<String, DataSourceContext> ds : dsource.entrySet()){
			sb.append("<dataSource>");
			DataSourceContext d = ds.getValue();
			sb.append("<property name=\"id\">"+ d.getId()+"</property>");
			sb.append("<property name=\"linktype\"><![CDATA["+ d.getLinktype()+"]]></property>");
			sb.append("<property name=\"linkname\"><![CDATA["+ d.getLinkname()+"]]></property>");
			sb.append("<property name=\"linkpwd\"><![CDATA["+ d.getLinkpwd()+"]]></property>");
			sb.append("<property name=\"linkurl\"><![CDATA["+ d.getLinkurl()+"]]></property>");
			sb.append("</dataSource>");
		}
	}
	
	public void createChart(StringBuffer sb, ChartContext chart) throws IOException{
		sb.append("<chart shape=\""+chart.getShape()+"\" xcol=\""+chart.getXcol()+"\" ycol=\""+chart.getYcol()+"\" width=\""+chart.getWidth()+"\" height=\""+chart.getHeight()+"\"");
		if(chart.getScol() != null && chart.getScol().length() > 0){
			sb.append(" scol=\""+chart.getScol()+"\" ");
		}
		if(chart.getY2col() != null && chart.getY2col().length() > 0){
			sb.append(" y2col=\""+chart.getY2col()+"\"");
		}
		if(chart.getY3col() != null && chart.getY3col().length() > 0){
			sb.append(" y3col=\""+chart.getY3col()+"\"");
		}
		sb.append(">");
		sb.append("<property>");
		if(chart.getProperties() != null){
			List<ChartKeyContext> ls = chart.getProperties();
			for(ChartKeyContext key : ls){
				//忽略掉图形钻取功能
				if("action".equalsIgnoreCase(key.getName())){
					continue;
				}
				sb.append("<key name=\""+key.getName()+"\" value=\""+key.getValue()+"\"/>");
			}
		}
		sb.append("</property>");
		sb.append("<ds");
		if(chart.getRefDataCenter() != null && chart.getRefDataCenter().length() > 0){
			sb.append(" refDataCenter=\""+chart.getRefDataCenter()+"\"");
		}
		sb.append("><![CDATA[ ");
		String templateName = chart.getTemplateName();
		if(templateName != null){
			String sql = TemplateManager.getInstance().getTemplate(templateName);
			sb.append(sql);
		}
		sb.append("]]></ds>");
		sb.append("</chart>");
	}
	
	public void createCrossReport(StringBuffer sb, CrossReportContext report) throws IOException{
		sb.append("<crossReport out=\"html\">");
		//生成baseKpi
		if(report.getBaseKpi() != null){
			CrossKpi bkpi = report.getBaseKpi();
			sb.append("<baseKpi alias=\""+ bkpi.getAlias()+"\" aggregation=\""+bkpi.getAggregation()+"\" formatPattern=\""+(bkpi.getFormatPattern() != null ? bkpi.getFormatPattern() : "")+"\" />");
		}
		sb.append("<report-cols>");
		this.loopField2ColXML(report.getCrossCols().getCols(), sb, 1);
		sb.append("</report-cols>");
		sb.append("<report-rows>");
		this.loopField2ColXML(report.getCrossRows().getRows(), sb, 2);
		sb.append("</report-rows>");
		sb.append("<ds");
		if(report.getRefDataCetner() != null && report.getRefDataCetner().length() > 0){
			sb.append(" refDataCenter=\""+report.getRefDataCetner()+"\"");
		}
		sb.append("><![CDATA[ ");
		String templateName = report.getTemplateName();
		if(templateName != null){
			String sql = TemplateManager.getInstance().getTemplate(templateName);
			sb.append(sql);
		}
		sb.append("]]></ds>");
		sb.append("</crossReport>");
	}
	
	private void loopField2ColXML(List<CrossField> ls, StringBuffer sb, int tp){
		if(ls == null){
			return;
		}
		for(CrossField field : ls){
			sb.append("<cross"+(tp==1?"Col":"Row")+" desc=\""+field.getDesc()+"\" type=\""+field.getType()+"\""); 
			if(field.getAlias() != null){
				sb.append(" alias=\""+field.getAlias()+"\"");
			}
			String type = field.getType();
			if("kpiOther".equalsIgnoreCase(type)){
				String fmt = field.getFormatPattern();
				if(fmt != null && fmt.length() > 0){
					sb.append(" formatPattern=\""+fmt+"\"");
				}
				String ag = field.getAggregation();
				if(ag != null && ag.length() > 0){
					sb.append(" aggregation=\""+ag+"\"");
				}
				BigDecimal rate = field.getKpiRate();
				if(rate != null){
					sb.append(" kpiRate=\""+rate+"\"");
				}
			}else if("none".equalsIgnoreCase(type)){
				
			}else{
				String aliasDesc = field.getAliasDesc();
				if(aliasDesc != null && aliasDesc.length() > 0){
					sb.append(" aliasDesc=\""+aliasDesc+"\"");
				}
				sb.append(" multi=\"true\"");
				if(field.getCasParent() != null && field.getCasParent()){
					sb.append(" casParent=\""+field.getCasParent()+"\"");
				}
				if(field.getValue() != null && field.getValue().length() > 0){
					sb.append(" value=\""+field.getValue()+"\"");
				}
			}
			if(field.getOrder() != null && field.getOrder()){
				sb.append(" order=\"true\" ");
			}
			sb.append(">");
			
			loopField2ColXML(field.getSubs(), sb, tp);
			sb.append("</cross"+(tp==1?"Col":"Row")+">\n");

		}
		
	}
	
}
