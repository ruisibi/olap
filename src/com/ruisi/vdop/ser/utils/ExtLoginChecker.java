package com.ruisi.vdop.ser.utils;

import javax.servlet.ServletContext;

import com.ruisi.ext.engine.control.sys.LoginSecurityAdapter;
import com.ruisi.ext.engine.dao.DaoHelper;
import com.ruisi.ext.engine.wrapper.ExtRequest;
import com.ruisi.ext.engine.wrapper.ExtResponse;
import com.ruisi.vdop.bean.User;
import com.ruisi.vdop.util.VdopConstant;

public class ExtLoginChecker implements LoginSecurityAdapter {

	public boolean loginChk(ExtRequest req, ExtResponse arg1, ServletContext ctx, DaoHelper arg2) {
		User user = (User)req.getSession().getAttribute(VdopConstant.USER_KEY_IN_SESSION);
		User user2 = (User)req.getSession().getAttribute(VdopConstant.USER_KEY_IN_SESSION_3G); //移动端是否登录
		if(user == null && user2 == null){
			return false;
		}else{
			return true;
		}
	}
}
