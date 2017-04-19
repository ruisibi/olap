package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;
import java.util.List;

import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.util.VDOPUtils;

public class SetAction {
	
	public String execute() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		List<ReportVO> ls = fs.listAllReport(false, 1);
		VDOPUtils.getRequest().setAttribute("ls", ls);
		
		return "success";
	}
}
