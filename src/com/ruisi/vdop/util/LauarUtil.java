package com.ruisi.vdop.util;

import java.util.*;

/**
 * 公历转农历
 * @author hq
 * @date 2013-11-18
 */
public class LauarUtil {
	private static String[] daySTrPreArray = { "初", "十", "廿", "卅", " " };
	 
    private static String[] dayStrArray = { "", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二" };


    //private static String[] weekStrArray = { "", "日", "一", "二", "三", "四", "五", "六" };


    final static long[] lunarInfo = new long[] { 0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,

                    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,

                    0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0,

                    0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550,

                    0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260,

                    0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,

                    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3,

                    0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0,

                    0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0,

                    0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,

                    0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0 };


    final public static int lYearDays(int y)// ====== 传回农历 y年的总天数

    {

            int i, sum = 348;

            for (i = 0x8000; i > 0x8; i >>= 1) {

                    if ((lunarInfo[y - 1900] & i) != 0)

                            sum += 1;

            }

            return (sum + leapDays(y));

    }


    final public static int leapDays(int y)// ====== 传回农历 y年闰月的天数

    {

            if (leapMonth(y) != 0) {

                    if ((lunarInfo[y - 1900] & 0x10000) != 0)

                            return 30;

                    else

                            return 29;

            } else

                    return 0;

    }


    final public static int leapMonth(int y)// ====== 传回农历 y年闰哪个月 1-12 , 没闰传回 0

    {

            return (int) (lunarInfo[y - 1900] & 0xf);

    }


    final public static int monthDays(int y, int m)// ====== 传回农历 y年m月的总天数

    {

            if ((lunarInfo[y - 1900] & (0x10000 >> m)) == 0)

                    return 29;

            else

                    return 30;

    }


    final public static String AnimalsYear(int y)// ====== 传回农历 y年的生肖

    {

            final String[] Animals = new String[] { "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪" };

            return Animals[(y - 4) % 12];

    }


    final public static String cyclicalm(int num)// ====== 传入 月日的offset 传回干支,

                                                                                                    // 0=甲子

    {

            final String[] Gan = new String[] { "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸" };

            final String[] Zhi = new String[] { "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥" };

            return (Gan[num % 10] + Zhi[num % 12]);

    }


    final public static String cyclical(int y)// ====== 传入 offset 传回干支, 0=甲子

    {

            int num = y - 1900 + 36;

            return (cyclicalm(num));

    }


    final public long[] Lunar(int y, int m)// 传出农历.year0 .month1 .day2 .yearCyl3

                                                                                    // .monCyl4

    // .dayCyl5 .isLeap6

    {

            final int[] year20 = new int[] { 1, 4, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1 };

            final int[] year19 = new int[] { 0, 3, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0 };

            final int[] year2000 = new int[] { 0, 3, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1 };

            long[] nongDate = new long[7];

            int i = 0, temp = 0, leap = 0;

            Date baseDate = new Date(1900, 1, 31);

            Date objDate = new Date(y, m, 1);

            long offset = (objDate.getTime() - baseDate.getTime()) / 86400000L;

            if (y < 2000)

                    offset += year19[m - 1];

            if (y > 2000)

                    offset += year20[m - 1];

            if (y == 2000)

                    offset += year2000[m - 1];

            nongDate[5] = offset + 40;

            nongDate[4] = 14;


            for (i = 1900; i < 2050 && offset > 0; i++) {

                    temp = lYearDays(i);

                    offset -= temp;

                    nongDate[4] += 12;

            }

            if (offset < 0) {

                    offset += temp;

                    i--;

                    nongDate[4] -= 12;

            }

            nongDate[0] = i;

            nongDate[3] = i - 1864;

            leap = leapMonth(i); // 闰哪个月

            nongDate[6] = 0;


            for (i = 1; i < 13 && offset > 0; i++) {

                    // 闰月

                    if (leap > 0 && i == (leap + 1) && nongDate[6] == 0) {

                            --i;

                            nongDate[6] = 1;

                            temp = leapDays((int) nongDate[0]);

                    } else {

                            temp = monthDays((int) nongDate[0], i);

                    }


                    // 解除闰月

                    if (nongDate[6] == 1 && i == (leap + 1))

                            nongDate[6] = 0;

                    offset -= temp;

                    if (nongDate[6] == 0)

                            nongDate[4]++;

            }


            if (offset == 0 && leap > 0 && i == leap + 1) {

                    if (nongDate[6] == 1) {

                            nongDate[6] = 0;

                    } else {

                            nongDate[6] = 1;

                            --i;

                            --nongDate[4];

                    }

            }

            if (offset < 0) {

                    offset += temp;

                    --i;

                    --nongDate[4];

            }

            nongDate[1] = i;

            nongDate[2] = offset + 1;

            return nongDate;

    }


    final public static long[] calElement(int y, int m, int d)

    // 传出y年m月d日对应的农历.year0 .month1 .day2 .yearCyl3 .monCyl4 .dayCyl5 .isLeap6

    {

            long[] nongDate = new long[7];

            int i = 0, temp = 0, leap = 0;

            Date baseDate = new Date(0, 0, 31);

            Date objDate = new Date(y - 1900, m - 1, d);

            long offset = (objDate.getTime() - baseDate.getTime()) / 86400000L;

            nongDate[5] = offset + 40;

            nongDate[4] = 14;


            for (i = 1900; i < 2050 && offset > 0; i++) {

                    temp = lYearDays(i);

                    offset -= temp;

                    nongDate[4] += 12;

            }

            if (offset < 0) {

                    offset += temp;

                    i--;

                    nongDate[4] -= 12;

            }

            nongDate[0] = i;

            nongDate[3] = i - 1864;

            leap = leapMonth(i); // 闰哪个月

            nongDate[6] = 0;


            for (i = 1; i < 13 && offset > 0; i++) {

                    // 闰月

                    if (leap > 0 && i == (leap + 1) && nongDate[6] == 0) {

                            --i;

                            nongDate[6] = 1;

                            temp = leapDays((int) nongDate[0]);

                    } else {

                            temp = monthDays((int) nongDate[0], i);

                    }


                    // 解除闰月

                    if (nongDate[6] == 1 && i == (leap + 1))

                            nongDate[6] = 0;

                    offset -= temp;

                    if (nongDate[6] == 0)

                            nongDate[4]++;

            }


            if (offset == 0 && leap > 0 && i == leap + 1) {

                    if (nongDate[6] == 1) {

                            nongDate[6] = 0;

                    } else {

                            nongDate[6] = 1;

                            --i;

                            --nongDate[4];

                    }

            }

            if (offset < 0) {

                    offset += temp;

                    --i;

                    --nongDate[4];

            }

            nongDate[1] = i;

            nongDate[2] = offset + 1;

            return nongDate;

    }


    public static String getchina(int day) {

            if (day == 10)

                    return "初十";

            if (day == 20)

                    return "二十";

            if (day == 30)

                    return "三十";

            String a = daySTrPreArray[(int) ((day) / 10)];

            a += dayStrArray[(int) (day % 10)];

            return a;

    }
    
    public static String getLauar2(Calendar cld) {

        int year = cld.get(Calendar.YEAR);

        int month = cld.get(Calendar.MONTH) + 1;

        int day = cld.get(Calendar.DAY_OF_MONTH);


        long[] lauarStrArray = calElement(year, month, day);

        String monthStr = String.valueOf(lauarStrArray[1] < 10 ? "0" + lauarStrArray[1] : lauarStrArray[1]);

        return monthStr + (lauarStrArray[2] < 10 ? "0" + lauarStrArray[2] : lauarStrArray[2]);

}


    public static String getLauar(Calendar cld) {

            int year = cld.get(Calendar.YEAR);

            int month = cld.get(Calendar.MONTH) + 1;

            int day = cld.get(Calendar.DAY_OF_MONTH);


            long[] lauarStrArray = calElement(year, month, day);

            String monthStr = dayStrArray[(int) (lauarStrArray[1])];

            return "　农历" + monthStr + "-" + getchina((int) (lauarStrArray[2]));

    }


    public static void main(String[] args) {

            Calendar cld = Calendar.getInstance();
            cld.add(Calendar.DAY_OF_MONTH, -10);

                    System.out.println(getLauar2(cld));



    }

}
