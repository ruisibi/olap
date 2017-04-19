package com.ruisi.vdop.ser.utils;

import java.util.ArrayList;
import java.util.List;

import com.ruisi.vdop.bean.User;

public class LoginServ {
	public static List getUserInfo(Object uname){
		List ls = new ArrayList();
		if("admin".equals(uname)){
			User u = new User();
			u.setStaffId("admin");
			u.setUname("系统管理员");
			u.setUserId("admin");
			u.setPasswd("123456");
			u.setDeptId("0010102");
			u.setDeptLvl(2);
			ls.add(u);
		}else if("test".equals(uname)){
		
			User u2 = new User();
			u2.setStaffId("test");
			u2.setUname("测试用户");
			u2.setUserId("test");
			u2.setPasswd("123456");
			u2.setDeptId("0010101");
			u2.setDeptLvl(2);
			u2.setAdmin(false);
			ls.add(u2);
		}
		
		return ls;
	}

}
