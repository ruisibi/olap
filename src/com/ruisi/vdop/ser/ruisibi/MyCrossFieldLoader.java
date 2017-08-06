package com.ruisi.vdop.ser.ruisibi;

import java.util.List;
import java.util.Map;

import net.sf.json.JSONArray;

import com.ruisi.bi.engine.cross.CrossFieldLoader;
import com.ruisi.ext.engine.view.context.cross.CrossField;
import com.ruisi.ext.engine.wrapper.ExtRequest;

public class MyCrossFieldLoader implements CrossFieldLoader {
	
	private ExtRequest request;
	
	private JSONArray kpij;

	public void setRequest(ExtRequest request) {
		this.request = request;
		this.kpij = (JSONArray)request.getAttribute("kpij");
	}

	

	@Override
	public List loadField(String arg0, String arg1, Map arg2) {
		// TODO Auto-generated method stub
		return null;
	}



	@Override
	public CrossField loadFieldByKpiCode(String kpiCode) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String loadFieldName(String type, String value) {
		return "xxx";
	}

	@Override
	public List<String> loadUserCustomize(String userId, String mvId) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public static String loadFieldName(String aggre) {
		if("sum".equalsIgnoreCase(aggre)){
			return "合计值";
		}else if("avg".equalsIgnoreCase(aggre)){
			return "均值";
		}else if("max".equalsIgnoreCase(aggre)){
			return "最大值";
		}else if("min".equalsIgnoreCase(aggre)){
			return "最小值";
		}else if("count".equalsIgnoreCase(aggre)){
			return "计数";
		}else if("var".equalsIgnoreCase(aggre)){
			return "方差";
		}else if("sd".equalsIgnoreCase(aggre)){
			return "标准差";
		}else if("middle".equalsIgnoreCase(aggre)){
			return "中位数";
		}else{
			return "聚合项";
		}
	}
	
	
}
