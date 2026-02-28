"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface BarChartDataItem {
  name: string
  value: number
  fill?: string
}

export interface BarChartComponentProps {
  title: string
  description?: string
  data: BarChartDataItem[]
  chartConfig: ChartConfig
  valueKey?: string
  nameKey?: string
  footerText?: string
  trendingText?: string
  trendingUp?: boolean
  showFooter?: boolean
  className?: string
  showGrid?: boolean
  showYAxis?: boolean
}

export function BarChartComponent({
  title,
  description,
  data,
  chartConfig,
  valueKey = "value",
  nameKey = "name",
  footerText,
  trendingText,
  trendingUp = true,
  showFooter = true,
  className = "",
  showGrid = true,
  showYAxis = true,
}: BarChartComponentProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data}>
            {showGrid && <CartesianGrid vertical={false} />}
            <XAxis
              dataKey={nameKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 10)}
            />
            {showYAxis && (
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
            )}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey={valueKey} radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {showFooter && (trendingText || footerText) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {trendingText && (
            <div className="flex gap-2 font-medium leading-none">
              {trendingText} <TrendingUp className="h-4 w-4" />
            </div>
          )}
          {footerText && (
            <div className="leading-none text-muted-foreground">
              {footerText}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
