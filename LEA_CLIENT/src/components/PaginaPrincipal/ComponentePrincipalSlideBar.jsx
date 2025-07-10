import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    AppBar,
    CssBaseline,
    IconButton,
    Divider,
    useTheme,
    useMediaQuery,
    Collapse,
    Fade
} from '@mui/material';

import {
    ExpandLess,
    ExpandMore,
    Menu as MenuIcon,
    PersonAdd as PersonAddIcon,
    EventAvailable as EventAvailableIcon,
    CalendarToday as CalendarTodayIcon,
    History as HistoryIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    Inventory2 as Inventory2Icon,
    Group as GroupIcon,
    ListAlt as ListAltIcon,
    DateRange as DateRangeIcon,
    Image as ImageIcon,
} from '@mui/icons-material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Importa el ícono de camión desde FontAwesome (por ejemplo, faTruck)
import { faTruck } from '@fortawesome/free-solid-svg-icons';

import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FactoryIcon from '@mui/icons-material/Factory';
import ScienceIcon from '@mui/icons-material/Science';
import StraightenIcon from '@mui/icons-material/Straighten';

import SeguimientoTKJornaleros from '../SeguimientoTKJornaleros';
import ExcelStyleFooter from '../../utils/ExcelStyleFooter';

import TanquesUnidadTreCientos from '../TanquesVistaNiveles/Unidad300';
import CubaDeFermentacion from '../TanquesVistaNiveles/CubasDeFermentacion';
import TanquesUnidadCien from '../TanquesVistaNiveles/Unidad100';

// import AppointmentCalendar from './AppointmentCalendar';
// import PatientRegistration from './PatientRegistration';
// import AppointmentScheduler from './AppointmentScheduler';
// import FollowUpPanel from './FollowUpPanel';
import SGMRC from '../SGMRC';
// import PatientList from '../components/PatientList';
// import DocumentsPdfHistoriaClinicaPaciente from './SubModulosHistorial/DocumentsPdfHistoriaClinicaPaciente'
// import HistorialCompletoPaciente from './SubModulosHistorial/HistorialCompletoPaciente'
// import ControlDeCitasGeneral from './ControlDeCitasGeneral';

const drawerWidth = 280;
const tanqueIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAACAElEQVR4nO3V72vTQBwG8L7yrxJ845/kWBNwRfwBs2uusOlCFVlyd5WJ3VgrUzvHlI5mW90PG4qxBofC7MZAw7aiA90jl9EKKxXd1t6B+cID4e5efHjuILFYNNH83YwMWhdTGlsaibON21esyzFVZnjAupSK04qhZ/epWTpiZglEf9hMxdmq2JPamBFnjqFnD+jdV0f5xx4KuVbegmfKIHq2afS70T/DvBPpI/TfYF7/oGeDeb2Dni/MOz9ob2He6aCJxKMLRGdpQ2NBcsCCzBga/2ponAhTG5jWOLGM2aZb2YFf25Mat7KDCWO2KZBtoGhOBZzfQq5sh022gaJa2Sj/RIQpAvqqNTg//Qbz01U1r3i9vIWxIR5GfCsFfO8GeJCcgvuSorpAcX84h7obqAMscAdTGQ58oWFyGYYn3FEDWF1uYCzBsP/xGCdy8ImGaxvOZ/nA7J2nWJ37jWvldZGGe1KBywubMG9w/NztBP7YpTCvs/CMNOCkWcT6i05cK2tzFJPjRXnA0SGOYLM7MPhAMXqVywMSneJwuzvwe8NGWmfygBaZQd2xuwLfOTZsMiMPuPisjnu3GL5tdSLFWuYmD89IA/q1PeRpGePXKLwyxWHjOKI5gSswR40/Sel5HTbJh29SRFzraZvrCdDvQSKgHzVYU+wNJhVMLJr/YX4BOdwAOBJdN7AAAAAASUVORK5CYII="
const factoryIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAADc0lEQVR4nO3Wy08TQRgA8HrwoEb/AcWLR6Mx9Ju2CAUEekDi1ZtXb5oYCYHSLcQEqtIHj0aDYtmKCLRb5KVRU0B5LfISTBSQBmkk8hSktKyidcwQ0bap0pZu2AOTfMnuzmbml9nvy34i0e6I8sjLK9+v1Jk0aoN5Nlt773t+yX0nVUwrM2+WH8svMbcq9aY1Sk+TuVx1Mc0qtaY1dTE9pNJXLqkM9OdsneksrzhKbx4pq252949OYcfMEu57N4Vv1z7xZBdV/Ky393rHphfw4LgT37hT52Hs7Pr4x0Xc0jG08V7v20msMlQu8gYkJ0dwzgUX9o2pBRfufD3u98zxaenv/PwKHp6Yxj1vJjBVTM/zBiSftX/U6Qf5V0zOLeNnPSOYnKj1ebeXpANloGdztCYFb8AcbcUP35MJhtq8ttlZb67OtKrUmr6qS83dWdfvHAlljy6F4hQvJ0jy7pqx6ltVU/t6qbnRrdJXzuZqTTHhrN+blpbJpqbiVwqFKiIgpa8sND5s5gJxH+ZXcNmDZo9SV2HMLrp7Oavo3vkrOsu+cNZm09Ku9qWnexYpCg9kZHgiQpJN1QZ6uOxBk5tUpWNmGQ+MObGxusWjMtDsxfLyvWEvKvqLWykowJzBgF2FhZEjayWyW1YAHBgWqdQYDRz3OyJGMgAWe2IiJrmyGa1yOWYA6qKF47aDrAdobUtK8gO2JSZiG4A9mjguUiSD0NCLAGB7UhJmEBqMNo6LBMkg5OhITvYDvkxOJkAHHzguXCQDMN955owfkNwzAHN84bhwkFYAT3dKih+Q3FsB3FsCU1OxS6OJCPcHqdFs7Bl0AywS7bECeH1xm0Gek/mtgJzPZnipyi9CnfsnsEoiOcQAfAsKRGi94fTpgzsKtIjFR20IrQYDMgDuGoCYnQaeeCSRfAkGrEeIC/aHsfoE70BrbKy8QSpdDgYMNbhtFMiWQAbgXKNU+kWwQAvAhccymUu4QLH40pO4OI68EJgjvoj/zXG85qBYTD2Nj/cKFsgAlD5PSMCCBdYjVGOXy4ULtCH0rDWgWRVUkdgA+gN7QaEB35PeT7BABmB2sxcUZg4CrHb97gUFCWQAfvSEgNgR4P2TJw8wCK2zQgVaZLLDNgD3dgqE5bNIrAgdtyG0IlggIxbHb9WQhtKwslGKoEWyO0Thj1+iRv7RQzS1MwAAAABJRU5ErkJggg=="
const despachoIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAClUlEQVR4nO2YXWvTUBjH643gh/CzCG52RVm9ceCdd9q13gys65ompSztTbolTdaONgPtUiuscyjrqDejXTdR6F6oIC04QRBdKWKLLgxFeOQc2LqXxKW16TLJA38O5+ScP7/nOSccEovFjP897N4l0EOWbgIyuWZXZTcBc2YFz/4Min4blyCtzZi3H7Qo7rP+ECnrOFgsF3oCuMANyfU1EuTNoCZ9WSFgNjgox4hrd3oCWG8Dbl8fXj4AkbJ9PFJFvQBlFYi5ydsatvzq6JkBxrz9UKyBql4sL0E8YG8YFnDl8y+IB27CFHHFZkjAYg0g80yEOHWjYljA5e2vME1ehyhhvWxIwGIN4MkMBTGf7blhAXPrW+hl+WlYwMKnPZj22cCwgMUa4LkmoHysghlWy03SUs8rKLeh8wNo10Fyh1CHAwMy7iRsv/veVTHuZPcAX/f1wb5MwM0OzqBaBStvG/AoXQB3UIRhIoLbZDoP1fK3f9riRikEGSkMHjoCwwSH23mJgWZJBVDpDCI4/0QK6Kk0LOZLsLpRxe24kMbjp0EyKoAIjmY4CAnJI740LwEd5k5AqgKiyiG4N+X3J0QLaXj8tNARYEYKYzgl3yA/C/Op8MHc+isKEqS1oQiItjObL+GFUWkRXCQPUSmL+2j8YWimI0APHfmrryfIH8AtsLfkhH9gEgMel8PLwep6BS90kjzcHWPBRQm4j8bRc6V1zCEpXVsOL3uKL4vnocqJ1AA75x+6qPgx7yKFWivTLDaLplqZunz8Thv/Brrv6yS4UCAi7SmdFYpN7joJjtZkpJfvyMjEJSfJl/2stIsyW9uo4gyRiYvkt9BzTUZ6+qLJDoKn75PCzr0x9jdqUYadwunta8a5jT9NThfVNfqQwQAAAABJRU5ErkJggg=="
const despachoSalidaIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAACyElEQVR4nO2X3UtTcRjHf112HXRV110H/QcRdFFajl7oqovYzrYslsN2XuZk2Rbupe3MzGymJg4zXWvuOLfMVEKDodKWCGGJkSIFttFSc3NPnBPBnGfTs5rH4Hzhe7PD7+HD93mBISRJkqT/XNrG11BKo3+h0SWAUlgrAS7tgQS1AuZJarEYS1JGMDtyOdWfrNCHqF0HtATjO/Lt519AZggnT+H9xzfBlWL2RosAZF39eBbO6oMzCME+URMkPB/hgnEwb7tP4wGbqIDnbw1C19Qy75uOyFeoMITS5zRj+0UDLCOYgu8weixTTjCebWdQLMCeWAJkNcHMiarQQdFa7Jnkb/Efax5G4AwZDIsCiHvmOEg2ycuWERiY+7nl7dNoHGSGUFr0O1j5IMYLObyYgXKSAd4Z3E1ASzAO193TeU+O6AlaClgC1BaR4JsPa5DeAE57MsH1dOY3XTbgdosRmFmG7sgnGJj9XnLAcb4E8wH2v08A4fRApbEJdJZ2uFrTAHUtffByfq1oQLNvAbT2XlDqGzhX2XrA5J0vvCR8gEOfU3DD5AZbax/4hmPgG3kHvUNRMN7rBkNjb1GAZt8CqGqbwNoWgK7QBGdbKwNqw33umyDAlhdR0Ds6ObBse19FQVPXDN6pRcGAbHIsUG5Na2sAtHZvYcBcV5o6wd6+tRjrWvoJXKv37uiPVvbRVZA0l1puPfY3OUHnP9R8UuCOO+bmZ+t8gLr6tm9y3HYJCRRGOFZ5AcMToCCcK4KKyQn7MSVFr3SHJzcVa/ePA0Y6k2qd64BQQCVFh62P/KlcQEuLP6WmXAGh9RBG0ia1vuEH3TEAbu8ouzAbGOVcwXDHRcHFEEIYdfcIRjoSLCS3JOEJDg6jnPEr1c5DxdREcp3tpIqi/eoa11slSXdiN61H0V9ISVoPq/U0o8Adq6xVlCtQNJwkSaj0+gU5LoG0Pdl5TgAAAABJRU5ErkJggg=="
const despachoRecepcionIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAACfklEQVR4nO2Y309SYRjH+d/cygCTtHUdWsImXdiC+OXm3aFRnGlAOgsDanjlnTe2rPGbk3klgXYK3bpgTXRj0aGbvu3BIHMIh8NLycazfW/O9n6/n/O87/uc7ahU/VIby8O4SFI1A8RR+EJoYwB4NOhguP/OYDXnR85phDCuQ2poSJGEcR1yTgOq+SdsAaWsD8K1q0gGVhHLlxAtQpFi+RKSzyIQxkYhffCzA9wx30I8tKYYLHpGidAasvdvswH8+TWItFaNaKHCDDBaqCA9oql5dw1Y3VtE5sZ1dnDFE5Hnj4+L3QN+255HZkLPHlB/E5XteWWAx684vB8bady+5KSBOWByYqrhT1nHrzn5gLTgcHYWEs+jaLEgfc/OvoN3bTVvyqAsypQNSG9FC0lfZmaQmnvAHDA156p513MoUxHg/vQ0EvwSc8AEv4QDk0kZ4OktFg1GxJ+uMgeML0cgGo3KtpgObOOSqDWIR9bZA0bWkVJr/1ySTVdnY4Zm1K5Fj8zlS4q/vak2Iu9dsx7fd7ydjRmC29JpcXDHhDLHNc4Ja5U5rpaxNar5a2i3BaTO0cJegUlnRFl71kn5gIJ6uKedk5p0kjIVjZlmyrl88DnCcJuDsuS3h5HnvC09Fc/BZqJA4e0+xGxZljJvCvA7wr0BPF31Z9QVuXDib9GaVp4DQHHQweU+PYNSE3ULKHVziz8JYTy2rsiecW5G8lpX8PldqDUgacER6GjGiYxEs3LBGTj/91u9lGyfyEiUrWpXvPVFid7mX8OlNwvw2F8etgV8ZA6qH9rkf2fdrESZludXVHJqysbjPMky6LV3HwB6Yk1NrHy0e0BPz7z/S/0C85JRyEiiJ5gAAAAASUVORK5CYII="
const laboratoryIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAADdElEQVR4nO2WX0xSURzH7a25Htt66KnHHnpsaz30Ik25l1ylpZHOP+lFQTf1oRIJlm4Kglwdbs2/YJYh2taDc/innFNEFw+W2YMFSP4vlSGINYtfO1fBEFSQC7rm2b4bO9xzzud+f3/uiYr63wZf2ogLSNXKY2kjBCNqTVUzFnZAdNDYZxNYfqwFpdFJEwhI5XJEANFhQQN+MkYGEIUJHYTCZgkQjgqxXLnMlzYxww7oAQ0SMCrS4wQw1HHiIJ0OrvS9A6dCASt9A8ezSJwKBWyQJKzX1h5PwJW+gePtoOWkDx5inDgYDgdnzfNge9VOFYxNrYHZ6YWjKZKHsobrQrLl525ABIfajVs2dTs1j55FayIDJ264KJAr7fqJrz4OuvuhW+6+ODZpghJSaX9U1XwprHBFsrqzAlI116v/+Mdfa7GpNX4dROofm3AJSNVicXXDubDAiUTK00JSNd7Rq/u1V9+bRTmo3s7B9p0cdKtdq9t8QrZMikR10fTSAZwS1rR0PlN3r08HedW3/CO0tr5D6xRWq7rQnrTxlciayiUNHQ7jgvXQcJZtmRatIGvsdJTIm8ppgVOnc2r0DAboY2LoFYMBmnSiPiS4tszcHD2TCaulpV7JT4esZWUwwsSgNSOn4FBwLwjutSEMdy0VF9MOt7Gt73w+DDMx18vsPEZQcJpC/vnB+Jub3woL/W6MoA04DgYWi/odCuRMUREM3oj/XZ+SdSEguDqCiO5PTFqbIog9N0Vg7lwy4HjITk5lZ8PbhDsODVd05kDALnbal3E2G5xyecQAN0gSPtxPgW52qnlfuNdpWT2GW7ddDql0382oELNYFNwSn+/zP3o5I0HAewyjnjFyOPu+MPVZlMnAkJAIb9KyevzCqTO5T/UsFqxVVITshpHD8WkraO6gdejsURYL2h7kir3gWjO4iajkV0UiWsL1HsN8ANFcIGsRw1b74SZ6APvu3rPO7lGxh5EBx30Ag8nVmYIC6E1iWz2AI7GxcFDehRxiYu+usFv2ykoYiYvbueTq4phgF4tpA3SiIuFwtnplgEXiBSgWgy6O6fIAdienzpt5PNoAN0KUicdDLWfOA6jMyr8yjOEuc14e2CWSIwOzSySAjBrCcVdreu5lr0p+np1/VZucsoCspf3mEhOY0Nna5NR5ZNiBX5TjMv4C6QL4+OHsK14AAAAASUVORK5CYII="
const inventoryIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAABdElEQVR4nO2XzUrDQBDH9+Rj6NMIWnrtC4jmy7vmq+0DGLqbxpuaUrw2EO2tYEFcrdaLBS8evWvBWwPKyIBC0LZ62KRR9g9zyBKG3/5nNtkh5L+qbZQgixAKCPxQaEhASLkR7VS+lQ/XpIO596DmsrLu+GPd9UG16cOmycqkSIC66z+3Ti6hFXPQnOaLYjUefwOZL2DMIYwvQHObT6rFVhWrMSwMoOqyEkIinGbT9Uq9vqSYNCkM4DQpFv3xRQk4T9JBnlMPthd1m5El5gX4zERZ3mZkibl0kMhf3VzJQ8LlISHykPzx24xJE5xN0mu9gzVYRJBp2jLpLU53XwFhfJxr9GYB4lyM8zFCfjpZKMAU5BDLjT1ZqBLP0oazt2JUgxvVZsl2LbhWdtkyESQhuTGBF3bfOv0ReOHpq1ENBqIAheRWbTaJ+iOIz++hc3YH+CwKUEhutB53h4m8o65QB4Xk/uiTgWrTiVHbv8qgBzPJnaneAQ2xQWF62nBcAAAAAElFTkSuQmCC"
const rulerIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAABGklEQVR4nO3Zvw7BQBwH8HsvNjkW3dnFjEXCKWl08ACSa03FSjyAtbVgwe4BGLs6qX+ppEWP3P0k901u/6TffpNLi5Ck2AS7Viu7RBBDCXaHZv40MjVmEewhaDinm2cHT2fHRYeNTe1kt/AKQYhRSu/79ewF56/NywGDpAS7Aa5RSLHNpPIAgkDSUK27WY01i4CQRkSt22mV9cqZJ6AUJH1Ra9wRhqShWuOemDSkEVFrknMHDvScC6JWXyTOebNWaTgjwVpVrb9aqy+jVh8KTq2VN2qtvFFr5Y1aK2/UWnmj1sobtdZfvHPgbsJBbD03vwLbsO5z3yKF4XiQwnFJkNJwnyCl414hweCikOBwf/GxG90S/C4IjizAGWVO4G9159ExAAAAAElFTkSuQmCC"
const oilTankIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC8ElEQVR4nO2XW08TQRTH5xP4IfQ78OyzgJ+iERPFF126bLGQmEigt60UNRiUdmY3RKFSoJH6gAqliyiQUsEiDYkIBuMFpE0ADR5zlkuB3sAptpqe5J9u9uz+9zenO7NnCClFKUrxH0fZ2UrIJvKXfdIalxuMaXVcwHJeH4dEBYvghmKQzUiFA3DN1zrOyJIaj4wtQ2x6raCKjC2DXVLiyJSsnknt6lNe/ig0XGxHyIJMOpyzmp6yGunGzPiXgoPFdoQsNiNbRzZiFTrO32vsSRQaKnZIbY09cctVTyWx11KnzxP6lQ/TQV8EnvVG8gLo82hbNpHJxGlWh4ID77gNJ0eWwNWggKte0Y95/ZDJWacOEdmkLE6MLHKZzU6tQNvNLggPMggPUv0Yz/F4TgQ/gFyrLBKbSNdmJvgmSL+iwcNWBvCVAnyj0HVXAb86yj9RRLpGrDWezf2jDT1fgn7vLPR1R48krxqGFjODxMI2HCq+4IFb16meO6oPPlN7kXw1olMrYK1xbxKL4N6ae/N9L+F/fHS4vu4o3Lf7IehLwu1quIfqueN44bN3OZAJ2VIqiKM4TgWddQxW51MBV+c9eo67grzvoCwx/S89DBh/T8FpYvzvIO8sVl1PQPOzFEDNT6HzToB/FuNaMxz483VwMvQRWsyKDomVxMohnKtehcirT/zroNXIHLhq83YgnbcHQDYxXVg5HjgUMiEbwe9dW6MvzmMWO6FvcZPgrtC7GewciqmbmR7/nOxm9H5QZI+KqR/spaM/7bVsux/EsIvtpx2SkiiWjtohKQlkOtD23xAftBd6L2LZEbKkbJoum12z3qcajIbn9uQNaGAQmsAgNEOmXFmOLWW2ezPlLplboimAF03yRnA8euDi4ddvoUpy6MqUK8sBmO3eTDlkSV/BQPrRZMuRHJE3X4MoV1ypb03gBTiq7kAIqhtaE1Wi7Vy2HMkRefW9INnLkb5Kkjf0330XZsvlipPyLUUpSkH+gfgNveG1AdSxWEIAAAAASUVORK5CYII="
const coalInventoryIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAADyklEQVR4nO2WTUzTYBjH51c8ePbiwejFk/Fi9GSiHB2UePGiHsSPrd0AFaPYrlvjJ44tdO1kEaRlXRhDZWw6HWBQmBMjgoCAeCDRo9GoGIuIH+Mxb+PnAqPF0V14kv9l69Pnt+f/vv/MYFisxVJfJSXcShPlwa0Obx9Bc+8Jmhu3OryPcIo9wDDMckMu69Ap9wbCzr2g3P6J2uYuCLX1QdOdJ1Bz7R6cdIqyxc4/O3DCu2bBQUzlnrUWx6UW3MbJJtLzjaD5MZONLbPYuNd8Q3sqmhiBdEW6RsAlxr4SNP9y33HXqoWE24bbuEm3cDMVjPdA891BECNJZUMXLoe/zAT3txxc4yeCYs8vCFwRya0maO6jELk/44YincMZ4ZDQj8Jt/Li5nF3HMMzSrAKaKZZk+MapuSCic+hkhTBZ7KiWcZr/QNAcuXv3tWXzhsJJz0aC5h+ZKc9XE8mmqkMd/wUX/Webj6HcKU5Y7HzMYIAlmuEOkp5NOM3L3oa26esdgxBq64XrHQNZA4wmRqClcwiOnL08aabY/ZoBrXZv36XGO9PZBIrOoCvhLrDYvcOa4NABNlPs9/C9pwsKF02MAHIHp7hJVWCSFSsIlmLvJYsRcqGGEuydZMk3zgqIHngTqQR4UJcTvY46IViKvc0IiB7KGWDkYmZAtN5gCTaeK4uDpZjsLy7YmfEcdjLblwesxu+p+7W6bi9m2zPuJ4x5qi4LWrPczusKGDq2Sw4UY+tVAYaO7hp8Fa7QDW46eQWQazWmzStUAhY2j0l23QDldj7z5UivAGE8M+ArS+kF+CpcAcg11YB+YmdRwnlY1gtwTLIDck0DoDEP3Sq9AAd8ZSnkmnqLi7H16FbpBZhwHpaRa6oB9c7CmJYMzEUWhrRkoN5ZOK02A7fsyN+7dQcGv3SmqFC5Xb9eNBqrA19NPdirBEW+2np4HpsbYK4+5JJgLfw9F2lLXsEeTVkYbxTgNC9B4HYSYg+HFQVuP4Dz1QFoDYmzwqnp05yB6VmINoCG3OgegnjP6D+60T2kfDfTJtX2ac7AP4DGPPQX6NxFVtkAenG4qx9cQhgqxRYIJ/qVz6RbSeWZ9L9OWvo0ZWB6kS5xClmDXoqG+K62ga+pVRkW7xlVbCPdwlS2+v4fsKlVkevnoJvdQ+oAVfZpLhvr70MHW7Eq0a9sAA1BtsV7RhUbadbfm60+zXXKWVvA8NLEbIed4aSJclddfrb65lVUleimPdJndLD/xEVSGWKrEiuz3TevQhtBlpAuYQqJZut71Wxgvn2LZchS/QDs/Z4ylqUYbQAAAABJRU5ErkJggg=="
const ptapIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEElEQVR4nO1XW0ybZRj+o14si4l3Gq+9WeIh2ZUXGr3TmOiFTmLCDhod/2bQbcYD7SiU87G2bJzWrmdOgxFgZQilhUI5tQUKPdDT3xbKRMZhHDpwG9C+5v1dGwkU6CyuMXuSJ/nyfX2f7+nX73vftwTxDM/wP8L3FePHkUS84kxxv/1LzuAEEY84X2H86PMMFZzI6IRkwfiHRLzhVEHfzMXrE3BRYIXThf3TT9VMrdbzlqSLKqi87VDymixelmRs7USGCgpuL9E8we6ENKlxjddsdV9rc3SIOt158oHpNw7VlLzH80l5q02XXT36gCXSQ6nCBtW9U9BmmoNzV4bgktAGxe0rNC8IrPBtqR5uj92FGu0U/dlUoQ4wtrTVZpD3eRNiYooN8JxQ5ebk1Rn9GdJhqOv3weDkfXCtAlD+v6l2+QHvXmHbUtggniLOdVP3w5/DGN3UGtT2+SCnehRya4zrgg7XdYlm8sgTmZOqPMyc6tE/ixtM0GW/B87VYHizf/In4RhcEFjC5kL87poFUqTmXWOQGucyXGmZgCz58CORiio5uLF+32t4d7KrRqDLvhRxA6R5cRM+S1dC7q35HQZzWubpNctiYE+NPo8fCm6MA6fBNCfXet/e05yk23MyXWrYlGu8YF/eWxgp0szAmaKBHeZCPF3UD1LtH/vq4M/fqPsdWCJdQKx2p+xqTqB0laaJ9UGV7d6+giFm1dkgudIU0SCuZdXbD6yH95stHQZ+u/PGNnN8pUvGlhhA51s7sBgyr9EJ5NWRiAZxLb/JFZWmcfYhZFeNAr/DWR82WHzTdFfW7Y1KCKm0rdKvNU+xsMMczmE+7LSvRq2LVww9hQ02aiaPpUv0Wz3O5ajFUqRmOJmvhaym2bA5HCfma4G5xyuORC21AmlifWBHYpd3uy+kiw1gmt+IStC5EoScBgd8mt4BX2R308Rx7k3Htnx5EFoWNoAtNYCk2/3Lrg+lvNU+dLVlAlxRfmvKDzCxGACFaYkmjqONxz3LFDYoU9iHIqcZzeSRvFqjv3l4/9QQazYZZiCnZnStwTr34p65UKb1vp8q0gWxLP1X5vTT64B7VvV6PyAOAqGK4uFTty1thUWELVpQm6djbs6+HMCTA4GSqiCiAZY7kYoKC6nNPvgxXwiW+QcxNSjqpKCk2UIR0UKudL+cKRt+1G6eD4vxm3qAI2uNmblO6yJkyAwbVb1TrxJPAqnac4ol0gXHZh/Sgo6lLWDxquDW0MHLFxWBqJkm0oOsy/M18W/A/83RWlg/Tuc7FB7yLMIPOXwYvRN9haAe07USBM5NM1S2OxRELJpWLDvYrIY2qFGNQGZ5fdh0tMSmtahhfAG1iVhA2ud7PU2s38IyRJ/AahBy+Y3Abx6g2348Dfwb8HNlP00c4xyu6Xzr28yhBkuiD1QPTr9JxBJitecytv3WxU0w3FkHTv0InGeVQWG11oplsrZn8jh/ZOYoEscSjftSucKmx/6ypMlKx2AsaqAWcRgoU9iG8+uMwBLrA4IOV11yVkUiyeDZSTb/aKQYrAzY32EzirGocSjmQpuVNFudNRrfu6E5ksmTJzF4ZfvFSru872HsvqUs1iBTCl4iGVzvWUbJx0S84hyT+04Skzf7DbPkFSJekcTgCkkm108yuSMkk3OMiDeQDF49yeQBMonBrSLiDUkMXmrIIMngZhLxhoSEhudJ5q+JZy/zvmKz2S88bT/PQDzGX3j6JX4yBqDVAAAAAElFTkSuQmCC"
const GraphIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAES0lEQVR4nN2Y709bZRTH+8po4nvjS/UP8ZXGLG4NWxEipT+4HVO24WbL7b2lBfp7K2VCXTOhvT86WhhQoC2lsGfULKHq3skYzGTq1phsySBue7dg9R7zXCZIKtDeewvEk3zftE3zyXnO+Z7zPCrV/zWaOapex5AZE9+5TvC2kpGlQM9YIXb2Y4h9cQI4UiOEHU0bbqd+hQqcsRwIVOuw7W191DpLcPSfrcMOwZULwdCdONy4l4KZn+dh/tEtiLUdg5f5MDzL9sGv8S4o9J+DEcspYDs04HEa7lP+z99VHOz97u7XDVHrjJGlhM5MHySWJgEV8/8pDAiFaJmepi7Dgv80xC6owePWr7Z1t72pCJzhGnXMyNN/mJN+IXk/sysY2gfwH62lApB2NEGE1AhWP2GSBWdkOny4tsLfxfYFQxUCilqMwCpDw/X2E+DwttyQBKdnyIiJt8Ho8lTFcKhSwFd6POGF4Qtq6PEQ31adOQyXXN3/SJEMQKzn2SsipMNjHK285liq6swhiYBYT5I+8bjpS2eIfbsVN0Q1NYcUAMTCNRnp0Ah7dreRITO4W6XCIRmAuHFS9iZsQSu7mjD2uUqspCaAhU0Lwj5pcZ9/rwwQTwhswnLgkExArFt+kzhxygDx+ErcnTx0wKdTl8WxWDb48Wy9WVw4dEAoRGHEchKoS63tW4C6KDmDB79cOKQQ4GLfOXB0tT3cAsQrE95KjgrgL8MO6Cc/++vf9Vcauzd9ZAB/zwSB+VK7XYd4cuB97qgAvsyHgW+v2wbUR60w/2hBMcCYAuLPHq8NoG8awafePHjTa9A790KSArlnoLbP1uaIUTEP7iSCJl8efJl1SYD+zDrUObJQkyZBCmSye+IxaFxpYYfNDCpkM0iBTFr4B9DgH93YNmqGzLjmBhQHRBIzaeq/Aw2939zdBhwya1qv2xUZdUh2Jp/Dya4cfHJl4PzOZYG3lRJLyZoAoiogHWO/gcaZ3rksiFbD0jOd6WDNAFGFkC1ffQ+NgcHVMsDGiPctvLBOSLgoIYVq0jX1BOq6sqANhd4pA9zMojVtnvDJWvmRxEwGci9AF7gNDb3XllV7XZoIjtq4WuDgoCHN7E9wyjUl1PddfEO1V2gjlo/kXDuRBEg68VA82oZQ0KCqJJojpJvgbFDrekTFPNhHsqDunIXGYCihqiYMUWoQQ44sy7+noF2E70AET4M27B9TSQndEOnEx311kVcU7GZxAb5eZKGFpUEfsfZIgtuCjFIfEiy9YZ7wCuOradlw4yspuDjuEVo4asPAkh+olAjc3XqGTBk5WsBmHl+aFLOAqshY/Mck2FJBMHKUoGfJqfrx+tdUSgc2czxxCJ4u4dntzA1sPgEvT796Al4QlXkwJ342+EMcenIDcDpmFwjOVsJPK/g/VAcRzUNWtY4hp028bQ3PcQN+RI9aRRkZCvBn+Dv8Gy1rPn4gUIcRfwOBHIfq+y/q7QAAAABJRU5ErkJggg=="
const BarGraphIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAABxklEQVR4nO2UP0sDMRjGIy4iCErFD9Ev4WztJenQNd9C6cUcN7g4ii4qHdy0DlVqkrOF4tLJT1EqVgVbO3TqchILtdQr9q73r3IPBI7cXfLL87x5AUj0T4SZyGJmdRGzOojJDIibELM6Rqlls9KznWPWB4ibkGH1FJxx3QoeELuMCxfKKUTFCzZkX8FhKnZiE9e2+bgCKW9oVBwGCjUtLszkAOoyDRxlL2lUXKmhnkHYcWEmO5Den2g6b0NdnOfM6tb4t8o1SPlT1qysgijjwoVyCur8VNP5O6L8ArOHLmayDw94O2tWNj3DfS9uWH2/4oK6TCNmDcYO/OkZLJ+/WdYoP9YobyEme8O4xJlyQbmhXAG/42ooF/9KZO52Avfu1jSdVyDlVWTero+/2y3wDaiLI0jFG6T8chQXFa+TNeYMKDOIyY7rdvJzGWRPuabcUy5OPYSfcbm9DMqRWf9hYXV/L5shr3FNiBT37ckR2GZepIBqzfpoOAJGKZIALpqDZJaijxqw5mLDBHBWR6ZFP7eDftUUcTkfek2RBLA5X02RsB0kAc87ggTpCPEDMAoQkgA2EweHSmqwmFySenwbNYlgHiyCvgBQj7g8r5CLcAAAAABJRU5ErkJggg=="
const BarGraphComparativeIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAkklEQVR4nO2WQQqAIBBF525dyUV3aOHOVaeRwKt0A5cT7gIrQjMs3oO/lc9nnPkifyMMg55JeiAZidZmChi8CQleYdyiZ+oiQeMW9atmwuBdSLAWEqyFBGtLx5sJhpJ3MLiDBCMz2PCTmFa17UmDvsW6wqAjQWEGA59EWDPKok5wSSK3+ADKgissC+M0a4+SL7ABfPOo7DWe7fUAAAAASUVORK5CYII"

//https://icons8.com/icons/set/industrial--style-office
const menuItems = [
    {
        text: 'Produccion',
        icon: <img src={factoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
        subItems: [
            { text: 'Inventario de insumos', subKey: 'Inventariodeinsumos', icon: <img src={inventoryIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            { text: 'Tanques Jornaleros', subKey: 'Tanquesjornaleros', icon: <img src={rulerIcon} alt="tanquesjornaleros" style={{ width: 25, height: 25 }} /> },
            { text: 'Inventario Combust', subKey: 'Tanquesjornaleros', icon: <img src={coalInventoryIcon} alt="inventariomaderaycarbon" style={{ width: 25, height: 25 }} /> },
        ],
    },
    { text: 'Despacho', 
      icon: <img src={despachoIcon} alt="Despacho" style={{ width: 25, height: 25 }} />, 
       key: 'Despacho',
       subItems: [
            { text: 'Despachos', subKey: 'Inventariodeinsumos', icon: <img src={despachoSalidaIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
            { text: 'Recepcion', subKey: 'Tanquesjornaleros', icon: <img src={despachoRecepcionIcon} alt="Despacho" style={{ width: 25, height: 25 }} /> },
        ],
     },
     {
      text: 'Tanques',
      icon: <img src={tanqueIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
      key: 'tanquesniveles',
      subItems: [
            { text: 'UNIDAD 100', subKey: 'nivelesunidadtrecien', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'UNIDAD 300', subKey: 'nivelesunidadtrecientos', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'UNIDAD 450', subKey: 'nivelesunidadcuatrocientos', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'UNIDAD 800', subKey: 'nivelesunidadochocientos', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Cuba Fermentac', subKey: 'cubadefermentacion', icon: <img src={oilTankIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
        ],
    },
     {
      text: 'Data Analisis',
      icon: <img src={GraphIcon} alt="Despacho" style={{ width: 25, height: 25 }} />,
      key: 'dataanalisis',
      subItems: [
            { text: 'Insumos/mes', subKey: 'nivelesunidadcien', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Isumos/L[OH]', subKey: 'nivelesunidadcien', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Comparativo', subKey: 'comparativoIsumos/L[OH]', icon: <img src={BarGraphComparativeIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Agua/L[OH]', subKey: 'nivelesunidadtrecientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Carbon/L[OH]', subKey: 'nivelesunidadcuatrocientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
            { text: 'Madera/L[OH]', subKey: 'nivelesunidadochocientos', icon: <img src={BarGraphIcon} alt="nivelestanque" style={{ width: 25, height: 25 }} /> },
        ],
    },
    { text: 'Laboratorio', icon: <img src={laboratoryIcon} alt="laboratorio" style={{ width: 25, height: 25 }}  />, key: 'Laboratorio' },
    { text: 'Planta de Aguas', icon: <img src={ptapIcon} alt="plantadeaguas" style={{ width: 25, height: 25 }}  />, key: 'Laboratorio' },
];

export default function MedicalSchedulerApp() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState('Inventariodeinsumos');
    const [selectedMenuOption, setSelectedMenuOption] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openSubmenus, setOpenSubmenus] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        axios.get('https://ambiocomserver.onrender.com/api/pacientes')
            .then(res => setPatients(res.data))
            .catch(err => console.error('Error al obtener pacientes:', err));
    }, []);

    useEffect(() => {
        axios.get('https://ambiocomserver.onrender.com/api/appointments')
            .then(res => setAppointments(res.data))
            .catch(err => console.error('Error al obtener citas:', err));
    }, []);

    const refreshAppointments = async () => {
        try {
            const res = await axios.get('https://ambiocomserver.onrender.com/api/appointments');
            setAppointments(res.data);
        } catch (error) {
            console.error('Error actualizando citas:', error);
        }
    };

    const handleDrawerToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    const renderContent = () => {
        switch (selectedMenu) {
            case 'Tanquesjornaleros': return <SeguimientoTKJornaleros />;
            case 'Inventariodeinsumos': return <SGMRC />;
            case 'nivelesunidadtrecientos': return <TanquesUnidadTreCientos/>;
            case 'cubadefermentacion': return <CubaDeFermentacion/>;
            case 'nivelesunidadtrecien': return <TanquesUnidadCien/>;

            case 'Agendar Cita': return <AppointmentScheduler patients={patients} onCreate={refreshAppointments} />;
            case 'Calendario': return <AppointmentCalendar appointments={appointments} />;
            case 'Seguimiento': return <FollowUpPanel patients={patients} />;
            case 'Historial_Rayos': return <DocumentsPdfHistoriaClinicaPaciente patients={patients} />;
            case 'Historial_General': return <HistorialCompletoPaciente patients={patients} />;
            case 'pacientes': return <PatientList />;
            default: return null;
        }
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{
                justifyContent: 'center',
                background: 'linear-gradient(90deg, rgb(6, 59, 112) 0%, rgb(0, 89, 87) 50%, rgb(5, 165, 85) 100%)',
                color: 'white',
                mb: 1
            }}>
                <Typography variant="h6" noWrap>Ambiocom s.a.s</Typography>
            </Toolbar>
            <Divider />
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map(({ text, icon, subItems }) => (
                    <Box key={text}>
                        <ListItemButton
                            onClick={() => {
                                if (subItems) {
                                    setOpenSubmenus((prev) => ({ ...prev, [text]: !prev[text] }));
                                } else {
                                    setSelectedMenu(text);
                                    setSelectedMenuOption(text);
                                    if (isMobile) setMobileOpen(false);
                                }
                            }}
                            selected={selectedMenu === text}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                mx: 1,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    boxShadow: '0 0 8px rgba(33,150,243,0.4)',
                                    '& .MuiListItemIcon-root': { color: 'white' },
                                },
                            }}
                        >
                            <ListItemIcon>{icon}</ListItemIcon>
                            <ListItemText primary={text} />
                            {subItems && (openSubmenus[text] ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>

                        {subItems && (
                            <Collapse in={openSubmenus[text]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {subItems.map(({ text: subText, subKey, icon: subIcon }) => (
                                        <ListItemButton
                                            key={subKey}
                                            sx={{ pl: 5 }}
                                            selected={selectedMenu === subKey}
                                            onClick={() => {
                                                setSelectedMenu(subKey);
                                                setSelectedMenuOption(subKey);
                                                if (isMobile) setMobileOpen(false);
                                            }}
                                        >
                                            <ListItemIcon>{subIcon}</ListItemIcon>
                                            <ListItemText primary={subText} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                    </Box>
                ))}
            </List>
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: 12 }}>
                © 2025 HCabal. Todos los derechos reservados.
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                elevation={4}
                sx={{
                    width: { md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
                    ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {menuItems
                            .flatMap(item => item.subItems || [item])
                            .find(i => i.text === selectedMenu || i.subKey === selectedMenu)?.text || selectedMenu}
                    </Typography>
                </Toolbar>
            </AppBar>

            {(sidebarOpen || isMobile) && (
                <Drawer
                    variant={isMobile ? 'temporary' : 'persistent'}
                    open={isMobile ? mobileOpen : sidebarOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            bgcolor: 'background.paper',
                            borderRight: '1px solid #ddd',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            )}

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    mr: '5px',
                    minHeight: 'calc(100vh - 64px)',
                    bgcolor: 'background.default',
                    ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
                    transition: 'margin-left 0.3s',
                    overflowX: 'auto',
                }}
            >
                <Fade in={true} timeout={400} key={selectedMenu}>
                    <Box sx={{ p: 2 }}>
                        {renderContent()}
                    </Box>
                </Fade>
            </Box>
            <ExcelStyleFooter
                moduloActivo={selectedMenu}
            />
        </Box>
    );
}
