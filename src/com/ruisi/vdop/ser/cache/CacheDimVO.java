package com.ruisi.vdop.ser.cache;

public class CacheDimVO implements Comparable<CacheDimVO> {
	private String dimId; //维度ID
	private String value; //维度限制值，可以是多个，用逗号分隔
	private int ord; //维度顺序号
	
	
	@Override
	public int compareTo(CacheDimVO arg0) {
		CacheDimVO target = arg0;
		if(target.getOrd() > ord){
			return -1;
		}else if(target.getOrd() == ord){
			return 0;
		}else{
			return 1;
		}
	}
	public int getOrd() {
		return ord;
	}
	public void setOrd(int ord) {
		this.ord = ord;
	}
	public String getDimId() {
		return dimId;
	}
	public String getValue() {
		return value;
	}
	public void setDimId(String dimId) {
		this.dimId = dimId;
	}
	public void setValue(String value) {
		this.value = value;
	}
	
	
}
