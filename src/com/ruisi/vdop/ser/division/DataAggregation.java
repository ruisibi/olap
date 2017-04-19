package com.ruisi.vdop.ser.division;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections.map.CaseInsensitiveMap;

import com.ruisi.ext.engine.view.context.dc.grid.AggreVO;
import com.ruisi.ispire.dc.cube.operation.DataSetAggregation;
import com.ruisi.ispire.dc.grid.GridDataUtils;

/**
 * 列数据聚合(max/min/avg/sum/count)
 * @author hq
 * @date 2012-2-20
 */
public class DataAggregation {
	
	private String[] column; //需要聚合的字段(group by) 
	private AggreVO[] aggreVO;  //聚合对象
	
	private List datas; //数据
	
	public DataAggregation(String[] column, AggreVO[] aggreVO, List datas){
		this.column = column;
		this.aggreVO = aggreVO;
		this.datas = datas;
	}

	public List process() {
		Map<Object, List> dts = new LinkedHashMap<Object, List>();
		for(int i=0; i<datas.size(); i++){
			Map data = (Map)datas.get(i);
			StringBuffer key = new StringBuffer("");
			if(column != null){
				for(int j=0; j<column.length; j++){
					String col = column[j];
					if(col == null){
						continue;
					}
					Object colValue = data.get(col);
					key.append(colValue);
					if(j != column.length - 1){
						key.append("_");
					}
				}
			}
			String kstr = key.toString();
			if(!dts.containsKey(kstr)){
				dts.put(kstr, new ArrayList());
			}
			dts.get(kstr).add(data);
		}
		List retDatas = new ArrayList();
		for(Map.Entry<Object, List> dt : dts.entrySet()){
			//创建新数据
			Map newData = new CaseInsensitiveMap();
			//生成新数据的columns列(聚合列)
			if(column != null){
				Map firstDt = (Map)dt.getValue().get(0);
				for(String col : column){
					newData.put(col, firstDt.get(col));
				}
			}
			this.dataAggre(dt.getValue(), newData);
			retDatas.add(newData);
		}
		return retDatas;
		
	}

	private void dataAggre(List<Map> datas, Map newData) {
		int cnt = 0;
		for(AggreVO vo : aggreVO){
			cnt++;
		}
		//定义所有指标的计算数组
		List[] targetData = new List[cnt];
		for(int i=0; i<targetData.length; i++){
			targetData[i] = new ArrayList<Double>();
		}
		for(Map dt : datas){
			int index = 0;
			for(int i=0; i<aggreVO.length; i++){
				List<Double> dts = targetData[index];
				String nm = aggreVO[i].getName();
				Double val = GridDataUtils.getKpiData(dt, nm);
				if(val != null){
					dts.add(val);
				}
				index++;
			}
			
		}
		int index = 0;
		for(int i=0; i<aggreVO.length; i++){
			List<Double> dts = targetData[index];
			this.computeData(dts, aggreVO[i].getType(), aggreVO[i].getName(), aggreVO[i].getAlias(), newData);
			index++;
		}
	}
	
	/**
	 * 对数据进行计算
	 */
	private void computeData(List<Double> dts, String aggreType, String name, String alias, Map newData){
		if(aggreType.equalsIgnoreCase(DataSetAggregation.COUNT)){
			newData.put(alias == null || alias.length() == 0 ? name : alias, new Double(dts.size()));
		}else{
			Double retValue = null;
			if(dts.size() != 0){
				retValue = new Double(0);
			}
			if(aggreType.equalsIgnoreCase(DataSetAggregation.SUM) || aggreType.equalsIgnoreCase(DataSetAggregation.AVG)){
				for(Double dt : dts){
					retValue = retValue + dt;
				}
				if(aggreType.equalsIgnoreCase(DataSetAggregation.AVG)){
					retValue = retValue / dts.size();
				}
			}
			if(aggreType.equalsIgnoreCase(DataSetAggregation.MAX)){
				retValue = Collections.max(dts);
			}
			if(aggreType.equalsIgnoreCase(DataSetAggregation.MIN)){
				retValue = Collections.min(dts);
			}
			newData.put(alias == null || alias.length() == 0 ? name : alias, retValue);
		}
	}
}
