/**
 * 关卡数据模块
 */

const ROUTES = /*===ROUTES_START===*/
[
    {
        "id": "seeYouTomorrow",
        "title": "See You Tomorrow",
        "description": "一个关于爱、遗忘与存在的故事",
        "showToBeContinued": true,
        "levels": [
            {
                "id": "seeYouTomorrow_1",
                "title": "第 1 关",
                "target": "x+1",
                "descriptionPath": "story/seeYouTomorrow/ch0/levelseeYouTomorrow_1.md"
            },
            {
                "id": "seeYouTomorrow_2",
                "title": "第 2 关",
                "target": "x-0.5",
                "descriptionPath": "story/seeYouTomorrow/ch0/levelseeYouTomorrow_2.md"
            },
            {
                "id": "seeYouTomorrow_3",
                "title": "第 3 关",
                "target": "2x+3",
                "descriptionPath": "story/seeYouTomorrow/ch0/levelseeYouTomorrow_3.md"
            },
            {
                "id": "seeYouTomorrow_4",
                "title": "第 4 关",
                "target": "-3x+\\frac{2}{3}",
                "descriptionPath": "story/seeYouTomorrow/ch0/levelseeYouTomorrow_4.md"
            },
            {
                "id": "seeYouTomorrow_5",
                "title": "第 5 关",
                "target": "x^2",
                "descriptionPath": "story/seeYouTomorrow/ch1/levelseeYouTomorrow_5.md"
            },
            {
                "id": "seeYouTomorrow_6",
                "title": "第 6 关",
                "target": "2x^2-1",
                "descriptionPath": "story/seeYouTomorrow/ch1/levelseeYouTomorrow_6.md"
            },
            {
                "id": "seeYouTomorrow_7",
                "title": "第 7 关",
                "target": "x^3+2",
                "descriptionPath": "story/seeYouTomorrow/ch1/levelseeYouTomorrow_7.md"
            },
            {
                "id": "seeYouTomorrow_8",
                "title": "第 8 关",
                "target": "x^3+2x^2+3",
                "descriptionPath": "story/seeYouTomorrow/ch1/levelseeYouTomorrow_8.md"
            },
            {
                "id": "seeYouTomorrow_9",
                "title": "第 9 关",
                "target": "x^{0.5}",
                "descriptionPath": "story/seeYouTomorrow/ch2/levelseeYouTomorrow_9.md"
            },
            {
                "id": "seeYouTomorrow_10",
                "title": "第 10 关",
                "target": "x^{-0.5}",
                "descriptionPath": "story/seeYouTomorrow/ch2/levelseeYouTomorrow_10.md"
            },
            {
                "id": "seeYouTomorrow_11",
                "title": "第 11 关",
                "target": "x+x^{-1}",
                "descriptionPath": "story/seeYouTomorrow/ch2/levelseeYouTomorrow_11.md"
            },
            {
                "id": "seeYouTomorrow_12",
                "title": "第 12 关",
                "target": "2x^2+x^{0.5}",
                "descriptionPath": "story/seeYouTomorrow/ch2/levelseeYouTomorrow_12.md"
            },
            {
                "id": "seeYouTomorrow_13",
                "title": "第 13 关",
                "target": "3x^{-0.5}+x^{1.5}",
                "descriptionPath": "story/seeYouTomorrow/ch2/levelseeYouTomorrow_13.md"
            },
            {
                "id": "seeYouTomorrow_14",
                "title": "第 14 关",
                "target": "e^x",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_14.md"
            },
            {
                "id": "seeYouTomorrow_15",
                "title": "第 15 关",
                "target": "e^{2x}-3",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_15.md"
            },
            {
                "id": "seeYouTomorrow_16",
                "title": "第 16 关",
                "target": "e^{0.5x}-x",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_16.md"
            },
            {
                "id": "seeYouTomorrow_17",
                "title": "第 17 关",
                "target": "\\ln(x)",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_17.md"
            },
            {
                "id": "seeYouTomorrow_18",
                "title": "第 18 关",
                "target": "\\ln(2x+1)",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_18.md"
            },
            {
                "id": "seeYouTomorrow_19",
                "title": "第 19 关",
                "target": "\\ln(x^2+3)",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_19.md"
            },
            {
                "id": "seeYouTomorrow_20",
                "title": "第 20 关",
                "target": "\\ln(x^3-2x)",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_20.md"
            },
            {
                "id": "seeYouTomorrow_21",
                "title": "第 21 关",
                "target": "\\ln(e^x+1)",
                "descriptionPath": "story/seeYouTomorrow/ch3/levelseeYouTomorrow_21.md"
            },
            {
                "id": "seeYouTomorrow_22",
                "title": "第 22 关",
                "target": "\\sin(x)",
                "descriptionPath": "story/seeYouTomorrow/ch4/levelseeYouTomorrow_22.md"
            },
            {
                "id": "seeYouTomorrow_23",
                "title": "第 23 关",
                "target": "0.5*\\cos(x)+2",
                "descriptionPath": "story/seeYouTomorrow/ch4/levelseeYouTomorrow_23.md"
            },
            {
                "id": "seeYouTomorrow_24",
                "title": "第 24 关",
                "target": "\\tan(2x+3)",
                "descriptionPath": "story/seeYouTomorrow/ch4/levelseeYouTomorrow_24.md"
            },
            {
                "id": "seeYouTomorrow_25",
                "title": "第 25 关",
                "target": "\\sin(x^{0.5})",
                "descriptionPath": "story/seeYouTomorrow/ch4/levelseeYouTomorrow_25.md"
            },
            {
                "id": "seeYouTomorrow_26",
                "title": "第 26 关",
                "target": "\\sin(x^2-2x)",
                "descriptionPath": "story/seeYouTomorrow/ch4/levelseeYouTomorrow_26.md"
            },
            {
                "id": "seeYouTomorrow_27",
                "title": "第 27 关",
                "target": "\\cos(x+x^{-1})",
                "descriptionPath": "story/seeYouTomorrow/ch4/levelseeYouTomorrow_27.md"
            }
        ],
        "regions": [
            {
                "id": "seeYouTomorrow_ch0",
                "title": "第1章 银杏树下",
                "descriptionPath": "story/seeYouTomorrow/ch0/story.md",
                "levels": [
                    "seeYouTomorrow_1",
                    "seeYouTomorrow_2",
                    "seeYouTomorrow_3",
                    "seeYouTomorrow_4"
                ]
            },
            {
                "id": "seeYouTomorrow_ch1",
                "title": "第2章 淡蓝色发圈",
                "descriptionPath": "story/seeYouTomorrow/ch1/story.md",
                "levels": [
                    "seeYouTomorrow_5",
                    "seeYouTomorrow_6",
                    "seeYouTomorrow_7",
                    "seeYouTomorrow_8"
                ]
            },
            {
                "id": "seeYouTomorrow_ch2",
                "title": "第3章 镜中的人",
                "descriptionPath": "story/seeYouTomorrow/ch2/story.md",
                "levels": [
                    "seeYouTomorrow_9",
                    "seeYouTomorrow_10",
                    "seeYouTomorrow_11",
                    "seeYouTomorrow_12",
                    "seeYouTomorrow_13"
                ]
            },
            {
                "id": "seeYouTomorrow_ch3",
                "title": "第4章 盒子",
                "descriptionPath": "story/seeYouTomorrow/ch3/story.md",
                "levels": [
                    "seeYouTomorrow_14",
                    "seeYouTomorrow_15",
                    "seeYouTomorrow_16",
                    "seeYouTomorrow_17",
                    "seeYouTomorrow_18",
                    "seeYouTomorrow_19",
                    "seeYouTomorrow_20",
                    "seeYouTomorrow_21"
                ]
            },
            {
                "id": "seeYouTomorrow_ch4",
                "title": "第5章 第二个盒子",
                "descriptionPath": "story/seeYouTomorrow/ch4/story.md",
                "levels": [
                    "seeYouTomorrow_22",
                    "seeYouTomorrow_23",
                    "seeYouTomorrow_24",
                    "seeYouTomorrow_25",
                    "seeYouTomorrow_26",
                    "seeYouTomorrow_27"
                ]
            }
        ]
    },
    {
        "id": "classic",
        "title": "The Day Before Tomorrow",
        "description": "遗忘，相遇，直到一个人从代码里学会了爱。",
        "showToBeContinued": false,
        "levels": [
            {
                "id": "1",
                "title": "第 1 关",
                "target": "x+1",
                "descriptionPath": "story/classic/ch0/level1.md"
            },
            {
                "id": "2",
                "title": "第 2 关",
                "target": "2x",
                "descriptionPath": "story/classic/ch0/level2.md"
            },
            {
                "id": "3",
                "title": "第 3 关",
                "target": "2-x",
                "descriptionPath": "story/classic/ch0/level3.md"
            },
            {
                "id": "4",
                "title": "第 4 关",
                "target": "0.5x+2",
                "descriptionPath": "story/classic/ch0/level4.md"
            },
            {
                "id": "5",
                "title": "第 5 关",
                "target": "\\frac{x}{2}-1",
                "descriptionPath": "story/classic/ch0/level5.md"
            },
            {
                "id": "6",
                "title": "第 6 关",
                "target": "\\left|x\\right|",
                "descriptionPath": "story/classic/ch1/level6.md"
            },
            {
                "id": "7",
                "title": "第 7 关",
                "target": "\\left|x-1\\right|",
                "descriptionPath": "story/classic/ch1/level7.md"
            },
            {
                "id": "8",
                "title": "第 8 关",
                "target": "2-\\left|x\\right|",
                "descriptionPath": "story/classic/ch1/level8.md"
            },
            {
                "id": "9",
                "title": "第 9 关",
                "target": "x^2",
                "descriptionPath": "story/classic/ch1/level9.md"
            },
            {
                "id": "10",
                "title": "第 10 关",
                "target": "x^2-2",
                "descriptionPath": "story/classic/ch1/level10.md"
            },
            {
                "id": "11",
                "title": "第 11 关",
                "target": "\\sin(x)",
                "descriptionPath": "story/classic/ch2/level11.md"
            },
            {
                "id": "12",
                "title": "第 12 关",
                "target": "\\sin(2x)",
                "descriptionPath": "story/classic/ch2/level12.md"
            },
            {
                "id": "13",
                "title": "第 13 关",
                "target": "2\\sin(x)",
                "descriptionPath": "story/classic/ch2/level13.md"
            },
            {
                "id": "14",
                "title": "第 14 关",
                "target": "\\cos(x-1)",
                "descriptionPath": "story/classic/ch2/level14.md"
            },
            {
                "id": "15",
                "title": "第 15 关",
                "target": "\\sin(x)+\\cos(x)",
                "descriptionPath": "story/classic/ch2/level15.md"
            },
            {
                "id": "16",
                "title": "第 16 关",
                "target": "\\exp(x)",
                "descriptionPath": "story/classic/ch3/level16.md"
            },
            {
                "id": "17",
                "title": "第 17 关",
                "target": "\\exp(0.5x)",
                "descriptionPath": "story/classic/ch3/level17.md"
            },
            {
                "id": "18",
                "title": "第 18 关",
                "target": "\\exp(-x)",
                "descriptionPath": "story/classic/ch3/level18.md"
            },
            {
                "id": "19",
                "title": "第 19 关",
                "target": "\\ln(x)",
                "descriptionPath": "story/classic/ch3/level19.md"
            },
            {
                "id": "20",
                "title": "第 20 关",
                "target": "\\ln(x+2)",
                "descriptionPath": "story/classic/ch3/level20.md"
            },
            {
                "id": "21",
                "title": "第 21 关",
                "target": "\\left|x\\right|-2",
                "descriptionPath": "story/classic/ch4/level21.md"
            },
            {
                "id": "22",
                "title": "第 22 关",
                "target": "\\left|\\left|x\\right|-1\\right|",
                "descriptionPath": "story/classic/ch4/level22.md"
            },
            {
                "id": "23",
                "title": "第 23 关",
                "target": "\\left|x+2\\right|+\\left|x-2\\right|",
                "descriptionPath": "story/classic/ch4/level23.md"
            },
            {
                "id": "24",
                "title": "第 24 关",
                "target": "\\left|x^2-2\\right|",
                "descriptionPath": "story/classic/ch4/level24.md"
            },
            {
                "id": "25",
                "title": "第 25 关",
                "target": "\\sqrt{x}",
                "descriptionPath": "story/classic/ch4/level25.md"
            },
            {
                "id": "26",
                "title": "第 26 关",
                "target": "\\tan(x)",
                "descriptionPath": "story/classic/ch5/level26.md"
            },
            {
                "id": "27",
                "title": "第 27 关",
                "target": "\\tan(0.5x)",
                "descriptionPath": "story/classic/ch5/level27.md"
            },
            {
                "id": "28",
                "title": "第 28 关",
                "target": "x+\\sin(x)",
                "descriptionPath": "story/classic/ch5/level28.md"
            },
            {
                "id": "29",
                "title": "第 29 关",
                "target": "x-\\sin(x)",
                "descriptionPath": "story/classic/ch5/level29.md"
            },
            {
                "id": "30",
                "title": "第 30 关",
                "target": "x\\sin(x)",
                "descriptionPath": "story/classic/ch5/level30.md"
            },
            {
                "id": "31",
                "title": "第 31 关",
                "target": "x^3",
                "descriptionPath": "story/classic/ch6/level31.md"
            },
            {
                "id": "32",
                "title": "第 32 关",
                "target": "x^3-x",
                "descriptionPath": "story/classic/ch6/level32.md"
            },
            {
                "id": "33",
                "title": "第 33 关",
                "target": "x(x-1)(x+1)",
                "descriptionPath": "story/classic/ch6/level33.md"
            },
            {
                "id": "34",
                "title": "第 34 关",
                "target": "\\frac{1}{2}x^3-x",
                "descriptionPath": "story/classic/ch6/level34.md"
            },
            {
                "id": "35",
                "title": "第 35 关",
                "target": "\\ln(x^2+1)",
                "descriptionPath": "story/classic/ch6/level35.md"
            },
            {
                "id": "36",
                "title": "第 36 关",
                "target": "\\frac{1}{x}",
                "descriptionPath": "story/classic/ch7/level36.md"
            },
            {
                "id": "37",
                "title": "第 37 关",
                "target": "\\frac{1}{x-1}",
                "descriptionPath": "story/classic/ch7/level37.md"
            },
            {
                "id": "38",
                "title": "第 38 关",
                "target": "\\frac{1}{x^2+1}",
                "descriptionPath": "story/classic/ch7/level38.md"
            },
            {
                "id": "39",
                "title": "第 39 关",
                "target": "\\frac{x}{x^2+1}",
                "descriptionPath": "story/classic/ch7/level39.md"
            },
            {
                "id": "40",
                "title": "第 40 关",
                "target": "\\frac{x}{x^2-1}",
                "descriptionPath": "story/classic/ch7/level40.md"
            },
            {
                "id": "41",
                "title": "第 41 关",
                "target": "\\arcsin(x)",
                "descriptionPath": "story/classic/ch8/level41.md"
            },
            {
                "id": "42",
                "title": "第 42 关",
                "target": "\\arccos(x)",
                "descriptionPath": "story/classic/ch8/level42.md"
            },
            {
                "id": "43",
                "title": "第 43 关",
                "target": "\\arctan(x)",
                "descriptionPath": "story/classic/ch8/level43.md"
            },
            {
                "id": "44",
                "title": "第 44 关",
                "target": "2\\arctan(x)",
                "descriptionPath": "story/classic/ch8/level44.md"
            },
            {
                "id": "45",
                "title": "第 45 关",
                "target": "\\arctan(2x)",
                "descriptionPath": "story/classic/ch8/level45.md"
            },
            {
                "id": "46",
                "title": "第 46 关",
                "target": "\\exp(-x)\\sin(x)",
                "descriptionPath": "story/classic/ch9/level46.md"
            },
            {
                "id": "47",
                "title": "第 47 关",
                "target": "\\exp(-0.5x)\\cos(x)",
                "descriptionPath": "story/classic/ch9/level47.md"
            },
            {
                "id": "48",
                "title": "第 48 关",
                "target": "\\exp(-\\left|x\\right|)\\sin(2x)",
                "descriptionPath": "story/classic/ch9/level48.md"
            },
            {
                "id": "49",
                "title": "第 49 关",
                "target": "\\exp(-x^2)\\cos(2x)",
                "descriptionPath": "story/classic/ch9/level49.md"
            },
            {
                "id": "50",
                "title": "第 50 关",
                "target": "\\ln(\\left|x\\right|+1)\\sin(x)",
                "descriptionPath": "story/classic/ch9/level50.md"
            },
            {
                "id": "51",
                "title": "第 51 关",
                "target": "\\sinh(x)",
                "descriptionPath": "story/classic/ch10/level51.md"
            },
            {
                "id": "52",
                "title": "第 52 关",
                "target": "\\cosh(x)",
                "descriptionPath": "story/classic/ch10/level52.md"
            },
            {
                "id": "53",
                "title": "第 53 关",
                "target": "\\tanh(x)",
                "descriptionPath": "story/classic/ch10/level53.md"
            },
            {
                "id": "54",
                "title": "第 54 关",
                "target": "x-\\tanh(x)",
                "descriptionPath": "story/classic/ch10/level54.md"
            },
            {
                "id": "55",
                "title": "第 55 关",
                "target": "\\cosh(x)-\\sinh(x)",
                "descriptionPath": "story/classic/ch10/level55.md"
            },
            {
                "id": "56",
                "title": "第 56 关",
                "target": "\\sin(x^2)",
                "descriptionPath": "story/classic/ch11/level56.md"
            },
            {
                "id": "57",
                "title": "第 57 关",
                "target": "\\sin(\\exp(x))",
                "descriptionPath": "story/classic/ch11/level57.md"
            },
            {
                "id": "58",
                "title": "第 58 关",
                "target": "\\cos(\\ln(\\left|x\\right|+1))",
                "descriptionPath": "story/classic/ch11/level58.md"
            },
            {
                "id": "59",
                "title": "第 59 关",
                "target": "\\sin(x+\\sin(x))",
                "descriptionPath": "story/classic/ch11/level59.md"
            },
            {
                "id": "60",
                "title": "第 60 关",
                "target": "\\sin(2x)\\cos(x)",
                "descriptionPath": "story/classic/ch11/level60.md"
            },
            {
                "id": "61",
                "title": "第 61 关",
                "target": "\\sqrt{x^2+1}",
                "descriptionPath": "story/classic/ch12/level61.md"
            },
            {
                "id": "62",
                "title": "第 62 关",
                "target": "\\sqrt{4-x^2}",
                "descriptionPath": "story/classic/ch12/level62.md"
            },
            {
                "id": "63",
                "title": "第 63 关",
                "target": "2\\sqrt{1-\\frac{x^2}{4}}",
                "descriptionPath": "story/classic/ch12/level63.md"
            },
            {
                "id": "64",
                "title": "第 64 关",
                "target": "\\frac{x}{\\sqrt{x^2+1}}",
                "descriptionPath": "story/classic/ch12/level64.md"
            },
            {
                "id": "65",
                "title": "第 65 关",
                "target": "\\ln(\\ln(\\left|x\\right|+2))",
                "descriptionPath": "story/classic/ch12/level65.md"
            },
            {
                "id": "66",
                "title": "第 66 关",
                "target": "\\sin(x)+0.5x",
                "descriptionPath": "story/classic/ch13/level66.md"
            },
            {
                "id": "67",
                "title": "第 67 关",
                "target": "\\sin(x)+\\frac{\\sin(2x)}{2}",
                "descriptionPath": "story/classic/ch13/level67.md"
            },
            {
                "id": "68",
                "title": "第 68 关",
                "target": "\\sin(x)+\\frac{\\sin(2x)}{2}+\\frac{\\sin(3x)}{3}",
                "descriptionPath": "story/classic/ch13/level68.md"
            },
            {
                "id": "69",
                "title": "第 69 关",
                "target": "x^{\\frac{2}{3}}+\\sqrt{1-x^2}\\sin(5x)",
                "descriptionPath": "story/classic/ch13/level69.md"
            },
            {
                "id": "70",
                "title": "第 70 关",
                "target": "\\tanh(x)\\sin(\\exp(x))",
                "descriptionPath": "story/classic/ch13/level70.md"
            },
            {
                "id": "71",
                "title": "第 71 关",
                "target": "x\\sin(\\frac{1}{x})",
                "descriptionPath": "story/classic/ch14/level71.md"
            },
            {
                "id": "72",
                "title": "第 72 关",
                "target": "2\\tanh(x)(\\ln(\\left|x\\right|+2)-\\ln(2))",
                "descriptionPath": "story/classic/ch14/level72.md"
            },
            {
                "id": "73",
                "title": "第 73 关",
                "target": "\\sin(x\\ln(\\left|x\\right|+1))",
                "descriptionPath": "story/classic/ch14/level73.md"
            },
            {
                "id": "74",
                "title": "第 74 关",
                "target": "\\exp(-0.1x^2)\\cos(x^2)",
                "descriptionPath": "story/classic/ch14/level74.md"
            },
            {
                "id": "75",
                "title": "第 75 关",
                "target": "\\arcsin(\\frac{2x}{1+x^2})",
                "descriptionPath": "story/classic/ch14/level75.md"
            }
        ],
        "regions": [
            {
                "id": "classic_ch0",
                "title": "第1章 雨天",
                "descriptionPath": "story/classic/ch0/story.md",
                "levels": [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5"
                ]
            },
            {
                "id": "classic_ch1",
                "title": "第2章 困局",
                "descriptionPath": "story/classic/ch1/story.md",
                "levels": [
                    "6",
                    "7",
                    "8",
                    "9",
                    "10"
                ]
            },
            {
                "id": "classic_ch2",
                "title": "第3章 同伴",
                "descriptionPath": "story/classic/ch2/story.md",
                "levels": [
                    "11",
                    "12",
                    "13",
                    "14",
                    "15"
                ]
            },
            {
                "id": "classic_ch3",
                "title": "第4章 北区",
                "descriptionPath": "story/classic/ch3/story.md",
                "levels": [
                    "16",
                    "17",
                    "18",
                    "19",
                    "20"
                ]
            },
            {
                "id": "classic_ch4",
                "title": "第5章 空地",
                "descriptionPath": "story/classic/ch4/story.md",
                "levels": [
                    "21",
                    "22",
                    "23",
                    "24",
                    "25"
                ]
            },
            {
                "id": "classic_ch5",
                "title": "第6章 醒来",
                "descriptionPath": "story/classic/ch5/story.md",
                "levels": [
                    "26",
                    "27",
                    "28",
                    "29",
                    "30"
                ]
            },
            {
                "id": "classic_ch6",
                "title": "第7章 日常",
                "descriptionPath": "story/classic/ch6/story.md",
                "levels": [
                    "31",
                    "32",
                    "33",
                    "34",
                    "35"
                ]
            },
            {
                "id": "classic_ch7",
                "title": "第8章 裂缝",
                "descriptionPath": "story/classic/ch7/story.md",
                "levels": [
                    "36",
                    "37",
                    "38",
                    "39",
                    "40"
                ]
            },
            {
                "id": "classic_ch8",
                "title": "第9章 真相",
                "descriptionPath": "story/classic/ch8/story.md",
                "levels": [
                    "41",
                    "42",
                    "43",
                    "44",
                    "45"
                ]
            },
            {
                "id": "classic_ch9",
                "title": "第10章 回去",
                "descriptionPath": "story/classic/ch9/story.md",
                "levels": [
                    "46",
                    "47",
                    "48",
                    "49",
                    "50"
                ]
            },
            {
                "id": "classic_ch10",
                "title": "第11章 重逢",
                "descriptionPath": "story/classic/ch10/story.md",
                "levels": [
                    "51",
                    "52",
                    "53",
                    "54",
                    "55"
                ]
            },
            {
                "id": "classic_ch11",
                "title": "第12章 平静",
                "descriptionPath": "story/classic/ch11/story.md",
                "levels": [
                    "56",
                    "57",
                    "58",
                    "59",
                    "60"
                ]
            },
            {
                "id": "classic_ch12",
                "title": "第13章 另一个他",
                "descriptionPath": "story/classic/ch12/story.md",
                "levels": [
                    "61",
                    "62",
                    "63",
                    "64",
                    "65"
                ]
            },
            {
                "id": "classic_ch13",
                "title": "第14章 四个人",
                "descriptionPath": "story/classic/ch13/story.md",
                "levels": [
                    "66",
                    "67",
                    "68",
                    "69",
                    "70"
                ]
            },
            {
                "id": "classic_ch14",
                "title": "第15章 第一天",
                "descriptionPath": "story/classic/ch14/story.md",
                "levels": [
                    "71",
                    "72",
                    "73",
                    "74",
                    "75"
                ]
            }
        ],
        "endingPath": "story/classic/ending.md"
    }
]
/*===ROUTES_END===*/;

window.ROUTES = ROUTES;
window.currentRouteId = ROUTES[0].id;
window.LEVELS = ROUTES[0].levels;
window.REGIONS = ROUTES[0].regions;
