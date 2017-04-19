package com.ruisi.vdop.ser.utils;

import java.util.HashMap;
import java.util.Map;

import com.ruisi.ext.engine.dao.DaoHelper;
import com.ruisi.ext.engine.service.loginuser.LoginUserInfoLoader;
import com.ruisi.ext.engine.wrapper.ExtRequest;
import com.ruisi.vdop.bean.User;
import com.ruisi.vdop.util.VdopConstant;

/**
 * ext 获取登录信息的方法
 * @author hq
 * @date Mar 25, 2010
 */
public class ExtLoginInfoLoader  implements LoginUserInfoLoader {

	public String getUserId() {
		return null;
	}

	public Map<String, Object> loadUserInfo(ExtRequest request, DaoHelper dao) {
		
		User user = (User)request.getSession().getAttribute(VdopConstant.USER_KEY_IN_SESSION);
		if(user == null){
			user = (User)request.getSession().getAttribute(VdopConstant.USER_KEY_IN_SESSION_3G);
		}
		Map<String, Object> m = new HashMap();
		/**
		m.put("userId", user.getUserId());
		m.put("staffId", user.getStaffId());
		**/
		return m;
	}

}
