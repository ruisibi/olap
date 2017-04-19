package com.ruisi.vdop.util;

public class SysUserBase {
	
	 protected String sysUser = VdopConstant.getSysUser(); //用在查询SQL替换系统用户

	public String getSysUser() {
		return sysUser;
	}

	public void setSysUser(String sysUser) {
		this.sysUser = sysUser;
	}
	 
	 
}
