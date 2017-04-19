package com.ruisi.vdop.ser.cache;

import java.util.Collections;
import java.util.List;

import com.ruisi.vdop.util.VDOPUtils;

public class CacheKeyVO {
	
	private List<CacheDimVO> cachekey;  //当前key 用到的维度
	
	private Integer jstype; //缓存对象所用到的指标计算方式, 以为计算同比的数据集和不计算的数据集 结果不一样，所以需要单独缓存。
	
	private String cubeId; //所属立方体
	private String dataControlKey; //数据权限的key, 由于数据权限不一样，缓存数据也不一样
	
	/**
	 * 返回维度个数
	 * @return
	 */
	public int getDimsize() {
		return cachekey.size();
	}
	
	public void setCacheKey(List<CacheDimVO> cachekey){
		//先排序
		Collections.sort(cachekey);
		this.cachekey = cachekey;
	}
	
	/**
	 * 根据立方体查询维度创建KEY,可以经过MD5加密
	 * key = cubeId + (维度ID + 维度value)多个
	 * @return
	 */
	public String createKey(){
		StringBuffer ret = new StringBuffer("");
		for(CacheDimVO vo : cachekey){
			CacheDimVO dim = vo;
			ret.append(dim.getDimId());
			if(dim.getValue() != null){
				ret.append(dim.getValue());
			}
		}
		//System.out.println(ret);
		if(this.jstype != null){
			ret.append(this.jstype);
		}
		if(this.dataControlKey != null && this.dataControlKey.length() > 0){  //加上数据权限的KEY
			ret.append(this.dataControlKey);
		}
		return VDOPUtils.getMD5((cubeId+ret).getBytes());
	}

	public String getCubeId() {
		return cubeId;
	}

	public void setCubeId(String cubeId) {
		this.cubeId = cubeId;
	}

	public Integer getJstype() {
		return jstype;
	}

	public void setJstype(Integer jstype) {
		this.jstype = jstype;
	}

	public String getDataControlKey() {
		return dataControlKey;
	}

	public void setDataControlKey(String dataControlKey) {
		this.dataControlKey = dataControlKey;
	}
	
}
