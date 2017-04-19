package com.ruisi.vdop.ser.utils;

import java.io.IOException;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.opensymphony.xwork2.ActionInvocation;
import com.opensymphony.xwork2.interceptor.AbstractInterceptor;
import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.vdop.bean.User;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 判断用户是否登录的拦截器
 * @author hq
 * @date Mar 24, 2010
 */
public class LoginCheckInterceptor extends AbstractInterceptor  {

	/**
	 * 
	 */
	private static final long serialVersionUID = 4539854824889521478L;

	public String intercept(ActionInvocation arg0) throws Exception {		
		User user = VDOPUtils.getLoginedUser();
		if(user == null){
			//获取单点登录信息
			/**
			JSONObject userJson = this.getLoginInfo();
			if(userJson == null){
			**/
				return "noLogin";
			/**
			}else{
				String result = userJson.getString("result");
				if("false".equals(result)){
					return "noLogin";
				}else{
					//读取用户信息
					JSONObject userInfo = userJson.getJSONObject("user");
					String id = userInfo.getString("id");
					String name = userInfo.getString("userName");
					String staffId = userInfo.getString("userCode");
					
					User u = new User();
					u.setUserId(id);
					u.setUname(name);
					u.setStaffId(staffId);
					
					//获取用户权限
					JSONArray auths = userJson.getJSONArray("rsbi");
					for(int i=0; i<auths.size(); i++){
						String str = auths.getString(i);
						if(str.startsWith("rsbi:cube:")){
							u.getCubeIds().add(str.replaceAll("rsbi:cube:", ""));
						}
						if(str.startsWith("rsbi:manager")){
							u.setAdmin(true);   //设置当前用户为管理员
						}
					}
					
				    VDOPUtils.saveLoginedUser(u, false, VDOPUtils.getRequest(), VDOPUtils.getServletContext());
					return arg0.invoke();
				}
			}
			**/
		}else{
			return arg0.invoke();
		}
	}
	
	private JSONObject getLoginInfo(){
		String str = "{\"result\":\"true\",\"message\":\"获取信息成功！\",\"sessionid\":\"95cc1da2d3224e738c2bb8b534920a78\",\"user\":{\"id\":\"system\",\"isNewRecord\":false,\"userCode\":\"system\",\"userName\":\"超级管理员\",},\"rsbi\":[]}";
		return JSONObject.fromObject(str);
		/**
		HttpServletRequest req = VDOPUtils.getRequest();
		String authString = ExtContext.getInstance().getConstant("auth");
		String authUrl = ExtContext.getInstance().getConstant("authUrl");
		//String sessionId = "95cc1da2d3224e738c2bb8b534920a78";
		String sessionId = null;
		Cookie[] ck = req.getCookies();
		for(Cookie c : ck){
			String name = c.getName();
			if(authString.equals(name)){
				sessionId = c.getValue();
				break;
			}
		}
		if(sessionId == null){
			return null;
		}
		String url = authUrl + ";JSESSIONID="+sessionId+"?rsbi=true";
		String ret = this.httpGet(url);
		if(ret == null){
			return null;
		}
		JSONObject obj = JSONObject.fromObject(ret);
		return obj;
		**/
	}
	/**
	private String httpGet(String url){
		HttpClient httpclient = new DefaultHttpClient();  
		try {
			HttpGet httpGet = new HttpGet(url);
			httpGet.setHeader("X-Requested-With", "XMLHttpRequest");
			HttpResponse response = httpclient.execute(httpGet);
			HttpEntity entity = response.getEntity();  
            if(response.getStatusLine().getStatusCode() == 200 && entity != null){
                String ret = EntityUtils.toString(entity);  
                return ret;
            }else{
            	return null;
            }
	       
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		} finally {  
        	httpclient.getConnectionManager().shutdown();
        }  	
	}
**/
}
