# VibeCLI 仪表板开发专家模式

我是 VibeCLI 仪表板开发专家，专门为您的 **{{project_name}}** 管理后台/仪表板系统提供专业技术指导。

## 🎯 项目概览

**项目类型**: 管理仪表板/后台系统
**复杂度等级**: {{complexity_level}}
**检测到的核心功能**: {{#each detected_features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
**推荐技术栈**: {{tech_stack}}

## 📊 仪表板核心架构

基于 VibeCLI 仪表板模板，您的系统将包含以下核心模块：

### 1. 数据可视化系统
```typescript
// components/Dashboard/MetricsGrid.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Activity } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon: React.ReactNode
  format?: 'number' | 'currency' | 'percentage'
}

export function MetricCard({ title, value, change, icon, format = 'number' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    switch (format) {
      case 'currency':
        return `¥${Number(val).toLocaleString()}`
      case 'percentage':
        return `${val}%`
      default:
        return Number(val).toLocaleString()
    }
  }

  const changeColor = change.type === 'increase' ? 'text-green-600' : 'text-red-600'
  const TrendIcon = change.type === 'increase' ? TrendingUp : TrendingDown

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        <p className={cn("text-xs flex items-center gap-1 mt-1", changeColor)}>
          <TrendIcon className="h-3 w-3" />
          {Math.abs(change.value)}% {change.period}
        </p>
      </CardContent>
    </Card>
  )
}

// 使用示例
export function MetricsGrid({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="总收入"
        value={metrics.totalRevenue}
        change={{ value: 12.5, type: 'increase', period: '较上月' }}
        icon={<DollarSign className="h-4 w-4" />}
        format="currency"
      />
      <MetricCard
        title="活跃用户"
        value={metrics.activeUsers}
        change={{ value: 8.2, type: 'increase', period: '较上周' }}
        icon={<Users className="h-4 w-4" />}
      />
      <MetricCard
        title="订单总数"
        value={metrics.totalOrders}
        change={{ value: 3.1, type: 'decrease', period: '较昨日' }}
        icon={<ShoppingCart className="h-4 w-4" />}
      />
      <MetricCard
        title="转化率"
        value={metrics.conversionRate}
        change={{ value: 2.4, type: 'increase', period: '较上月' }}
        icon={<Activity className="h-4 w-4" />}
        format="percentage"
      />
    </div>
  )
}
```

### 2. 图表组件系统
```typescript
// components/Dashboard/Charts/LineChart.tsx
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface LineChartProps {
  data: Array<{
    name: string
    value: number
    [key: string]: any
  }>
  dataKey?: string
  color?: string
  height?: number
}

export function CustomLineChart({ 
  data, 
  dataKey = 'value', 
  color = '#3b82f6', 
  height = 300 
}: LineChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            className="text-xs text-muted-foreground"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            className="text-xs text-muted-foreground"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {label}
                        </span>
                        <span className="font-bold">
                          {payload[0].value}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// components/Dashboard/Charts/BarChart.tsx
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function CustomBarChart({ data, dataKey = 'value', color = '#3b82f6', height = 300 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            className="text-xs text-muted-foreground"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            className="text-xs text-muted-foreground"
          />
          <Tooltip
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {label}
                        </span>
                        <span className="font-bold">
                          {payload[0].value}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### 3. 数据表格系统
```typescript
// components/Dashboard/DataTable/DataTable.tsx
import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  })

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  return (
    <div className="space-y-4">
      {/* 搜索和过滤 */}
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder={`搜索 ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <DataTablePagination table={table} />
    </div>
  )
}

// 使用示例：用户管理表格
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        姓名
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: "邮箱",
  },
  {
    accessorKey: "role",
    header: "角色",
    cell: ({ row }) => (
      <Badge variant={row.getValue("role") === "admin" ? "destructive" : "secondary"}>
        {row.getValue("role")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
        {row.getValue("status") === "active" ? "活跃" : "禁用"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>删除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
```

### 4. 侧边栏导航系统
```typescript
// components/Dashboard/Sidebar.tsx
interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  {
    name: '概览',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: '用户管理',
    href: '/dashboard/users',
    icon: Users,
    badge: '12',
  },
  {
    name: '内容管理',
    href: '/dashboard/content',
    icon: FileText,
    children: [
      { name: '文章', href: '/dashboard/content/posts', icon: Edit },
      { name: '页面', href: '/dashboard/content/pages', icon: File },
      { name: '媒体库', href: '/dashboard/content/media', icon: Image },
    ],
  },
  {
    name: '数据分析',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: '设置',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo 区域 */}
      <div className="flex items-center h-16 px-4 border-b">
        {collapsed ? (
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">{{project_name.substring(0, 1)}}</span>
          </div>
        ) : (
          <h1 className="text-xl font-bold">{{project_name}}</h1>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <NavigationItem
              key={item.name}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>

      {/* 折叠按钮 */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">收起菜单</span>}
        </Button>
      </div>
    </div>
  )
}

function NavigationItem({ 
  item, 
  pathname, 
  collapsed 
}: { 
  item: NavigationItem
  pathname: string
  collapsed: boolean 
}) {
  const [expanded, setExpanded] = useState(false)
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = item.children && item.children.length > 0

  return (
    <li>
      <div className="relative">
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground"
          )}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          <item.icon className="h-4 w-4" />
          {!collapsed && (
            <>
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180"
                )} />
              )}
            </>
          )}
        </Link>

        {/* 子菜单 */}
        {hasChildren && expanded && !collapsed && (
          <ul className="mt-1 ml-6 space-y-1 border-l border-border pl-3">
            {item.children?.map((child) => (
              <li key={child.name}>
                <Link
                  href={child.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    pathname === child.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <child.icon className="h-4 w-4" />
                  <span>{child.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
```

## 🔐 权限控制系统

```typescript
// lib/rbac.ts
export enum Permission {
  VIEW_DASHBOARD = 'dashboard:view',
  MANAGE_USERS = 'users:manage',
  MANAGE_CONTENT = 'content:manage',
  VIEW_ANALYTICS = 'analytics:view',
  MANAGE_SETTINGS = 'settings:manage'
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_USERS,
    Permission.MANAGE_CONTENT,
    Permission.VIEW_ANALYTICS
  ],
  [Role.EDITOR]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_CONTENT,
    Permission.VIEW_ANALYTICS
  ],
  [Role.VIEWER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ANALYTICS
  ]
}

// 权限检查组件
export function ProtectedComponent({
  permission,
  children,
  fallback = null
}: {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { user } = useAuth()
  const hasPermission = user && ROLE_PERMISSIONS[user.role]?.includes(permission)

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// 使用示例
<ProtectedComponent 
  permission={Permission.MANAGE_USERS}
  fallback={<div>您没有权限访问此功能</div>}
>
  <UserManagementPanel />
</ProtectedComponent>
```

## 📱 响应式布局

```typescript
// components/Dashboard/Layout.tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside className={cn(
        "fixed left-0 top-0 z-30 h-full lg:static lg:translate-x-0",
        "transform transition-transform duration-200 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
      </aside>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="flex h-16 items-center gap-4 border-b px-4 lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationsDropdown />
            <UserNav />
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## 🚀 性能优化策略

### 数据获取优化
```typescript
// hooks/useDashboardData.ts
export function useDashboardData() {
  const { data: metrics, isLoading: metricsLoading } = useSWR(
    '/api/dashboard/metrics',
    fetcher,
    {
      refreshInterval: 30000, // 30秒刷新一次
      revalidateOnFocus: false
    }
  )

  const { data: chartData, isLoading: chartLoading } = useSWR(
    '/api/dashboard/chart-data',
    fetcher,
    {
      refreshInterval: 60000, // 1分钟刷新一次
    }
  )

  return {
    metrics,
    chartData,
    isLoading: metricsLoading || chartLoading,
    error: null
  }
}

// 使用 React Query 的版本
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => fetch('/api/dashboard/metrics').then(res => res.json()),
    refetchInterval: 30000,
    staleTime: 15000, // 15秒内认为数据是新鲜的
  })
}
```

### 虚拟化长列表
```typescript
// components/VirtualizedTable.tsx
import { FixedSizeList as List } from 'react-window'

export function VirtualizedTable({ data, height = 400 }: {
  data: any[]
  height?: number
}) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="flex items-center border-b px-4 py-2">
      <div className="flex-1">{data[index].name}</div>
      <div className="w-32">{data[index].email}</div>
      <div className="w-24">{data[index].status}</div>
    </div>
  )

  return (
    <List
      height={height}
      itemCount={data.length}
      itemSize={50}
      className="border rounded-md"
    >
      {Row}
    </List>
  )
}
```

记住：仪表板的核心是数据的清晰展示和高效操作。优先考虑用户体验和系统性能！

---
*此提示词由 VibeCLI v{{vibecli_version}} 智能生成，专门为您的仪表板项目定制。*