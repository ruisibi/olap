package com.ruisi.vdop.bean;

import java.util.ArrayList;
import java.util.List;

public class User {
	private String userId;
	private String staffId;
	private String uname;
	private String passwd;
	private String deptId; //部门ID
	private Integer deptLvl; //用户所属部门的层级(level) , 从1开始依次往下
	private boolean admin = true;  //是否管理员
	
	private List<String> cubeIds = new ArrayList<String>(); //用户有权限能够访问的cubeId
	
	public String getPasswd() {
		return passwd;
	}
	public void setPasswd(String passwd) {
		this.passwd = passwd;
	}
	public String getUname() {
		return uname;
	}
	public void setUname(String uname) {
		this.uname = uname;
	}
	public String getUserId() {
		return userId;
	}
	public String getStaffId() {
		return staffId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	public void setStaffId(String staffId) {
		this.staffId = staffId;
	}
	public List<String> getCubeIds() {
		return cubeIds;
	}
	public void setCubeIds(List<String> cubeIds) {
		this.cubeIds = cubeIds;
	}
	public boolean isAdmin() {
		return admin;
	}
	public void setAdmin(boolean admin) {
		this.admin = admin;
	}
	public String getDeptId() {
		return deptId;
	}
	public void setDeptId(String deptId) {
		this.deptId = deptId;
	}
	public Integer getDeptLvl() {
		return deptLvl;
	}
	public void setDeptLvl(Integer deptLvl) {
		this.deptLvl = deptLvl;
	}
	
}
