package com.ruisi.vdop.ser.cache;

public class CacheInfoVO {
	
	private boolean state; //当前状态，是正在缓存还是缓存完成
	
	private int count; //缓存的记录数
	
	private long startTime; //缓存的开始时间
	private long endTime; //缓存结束时间

	public long getEndTime() {
		return endTime;
	}
	
	public void next(){
		count++;
	}

	public void setEndTime(long endTime) {
		this.endTime = endTime;
	}

	public boolean isState() {
		return state;
	}

	public int getCount() {
		return count;
	}

	public long getStartTime() {
		return startTime;
	}

	public void setState(boolean state) {
		this.state = state;
	}

	public void setCount(int count) {
		this.count = count;
	}

	public void setStartTime(long startTime) {
		this.startTime = startTime;
	}
	
	
}
