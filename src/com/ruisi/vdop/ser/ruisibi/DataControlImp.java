package com.ruisi.vdop.ser.ruisibi;

import java.util.Map;

import com.ruisi.vdop.bean.User;

/**
 * 数据权限控制实现类
 * @author zhaogy
 * @date 2017-1-18
 */
public class DataControlImp implements DataControlInterface {

	@Override
	public String process(User u, Map<String, String> tableAlias, String master) {
		if("MX_DATAS".equalsIgnoreCase(master)){
			int lvl = u.getDeptLvl();
			if(lvl == 1){
				return " and " + tableAlias.get("DEPT") + ".lv3_id = '"+u.getDeptId()+"' " ;
			}else if(lvl == 2){
				return " and " + tableAlias.get("DEPT") + ".lv2_id = '"+u.getDeptId()+"' " ;
			}else if(lvl == 3){
				return " and " + tableAlias.get("DEPT") + ".dept_id = '"+u.getDeptId()+"' " ;
			}
		}
		return "";
	}

}
