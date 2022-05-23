import Vue from 'vue'
import Router from 'vue-router'

import index from "@/components/AlarmWeb";
Vue.use(Router)

const router =new Router({
    routes: constantRoutes
})

export const constantRoutes = [
    {path:"/",name:'默认路由',redirect:index},

]


//抛出这个这个实例对象方便外部读取以及访问
export default router
