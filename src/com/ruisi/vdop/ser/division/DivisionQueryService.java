package com.ruisi.vdop.ser.division;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.ext.engine.view.context.dc.grid.AggreVO;
import com.ruisi.ispire.dc.cube.operation.DataSetAggregation;

/**
 * 分表查询 
 * @author hq
 * @date 2017-4-18
 */
public class DivisionQueryService {
	
	//private static Logger log = Logger.getLogger(DivisionQueryService.class);
	
	private String sql;
	
	private JSONObject dsourceJson;
	
	private JSONObject divison; //分表信息
	
	private String master;
	
	private JSONArray kpiJson; //指标信息
	
	public DivisionQueryService(String sql, JSONObject dsourceJson, JSONObject divison, String master, JSONArray kpiJson){
		this.sql = sql;
		this.dsourceJson = dsourceJson;
		this.divison = divison;
		this.master = master;
		this.kpiJson = kpiJson;
	}
	
	public List process(){
		//long start = System.currentTimeMillis();
		List datas = new ArrayList();
	
		JSONArray tabs = divison.getJSONArray("tabs");
		Thread[] ts = new Thread[tabs.size()];
		for(int i=0; i<tabs.size(); i++){
			Object idx = tabs.getJSONObject(i).get("idx");
			//替换sql中的 tableName
			String qsql = sql.replaceAll("\\[tableName\\]", master+"_ar" + idx);
			Thread t = new QueryThread(dsourceJson, qsql, datas);
			t.start();
			ts[i] = t;
		}
		//join 线程
		try{
			for(Thread t : ts){
				t.join();
			}
		}catch(Exception ex){
			ex.printStackTrace();
		}
		if(datas.size() == 0){
			return datas;
		}
		//聚合多表查询的数据
		//生成 聚合字段， 从 kpiJson 中取
		AggreVO[] avos = new AggreVO[kpiJson.size()];
		for(int i=0; i<kpiJson.size(); i++){
			JSONObject kpi = kpiJson.getJSONObject(i);
			AggreVO avo = new AggreVO();
			avo.setAlias(kpi.getString("alias"));
			avo.setName(kpi.getString("alias"));
			String aggre = kpi.getString("aggre");
			//对聚合后的数据再聚合时，由于count统计的是数量，必须改成sum
			if(DataSetAggregation.COUNT.equals(aggre)){
				aggre = DataSetAggregation.SUM;
			}
			avo.setType(aggre);
			avos[i] = avo;
		}
		//生成 group by 字段，直接从数据中取
		Map<String, Object> oneDt = (Map)datas.get(0);
		List<String> cols = new ArrayList<String>();
		for(Map.Entry<String, Object> ent : oneDt.entrySet()){
			String key = ent.getKey();
			if(!this.existInKpi(key, avos)){
				cols.add(key);
			}
		}
		String[] columns = new String[cols.size()];
		for(int i=0; i<cols.size(); i++){
			columns[i] = cols.get(i);
		}
		DataAggregation agg = new DataAggregation(columns, avos, datas);
		List ret = agg.process();
		//long end = System.currentTimeMillis();
		//System.out.println("耗时:" + ((end - start)/1000D));
		return ret;
	}
	
	private boolean existInKpi(String name, AggreVO[] avos){
		boolean exist = false;
		for(AggreVO vo : avos){
			if(vo.getName().equals(name)){
				exist = true;
				break;
			}
		}
		return exist;
	}
}
