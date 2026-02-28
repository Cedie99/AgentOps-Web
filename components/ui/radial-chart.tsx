"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { PolarGrid, RadialBar, RadialBarChart } from "recharts"

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

export interface RadialChartDataItem {
  name: string
  value: number
  fill: string
}

export interface RadialChartProps {
  title: string
  description?: string
  data: RadialChartDataItem[]
  chartConfig: ChartConfig
  valueKey?: string
  nameKey?: string
  innerRadius?: number
  outerRadius?: number
  maxHeight?: string
  footerText?: string
  trendingText?: string
  trendingUp?: boolean
  showFooter?: boolean
  className?: string
}

export function RadialChart({
  title,
  description,
  data,
  chartConfig,
  valueKey = "value",
  nameKey = "name",
  innerRadius = 30,
  outerRadius = 100,
  maxHeight = "250px",
  footerText,
  trendingText,
  trendingUp = true,
  showFooter = true,
  className = "",
}: RadialChartProps) {
  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square"
          style={{ maxHeight }}
        >
          <RadialBarChart data={data} innerRadius={innerRadius} outerRadius={outerRadius}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey={nameKey} />}
            />
            <PolarGrid gridType="circle" />
            <RadialBar dataKey={valueKey} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {showFooter && (
        <CardFooter className="flex-col gap-2 text-sm">
          {trendingText && (
            <div className="flex items-center gap-2 leading-none font-medium">
              {trendingText}{" "}
              {trendingUp ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          )}
          {footerText && (
            <div className="text-muted-foreground leading-none">
              {footerText}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
