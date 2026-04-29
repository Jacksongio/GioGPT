import dynamic from "next/dynamic"

const GioGPT = dynamic(() => import("./giogpt"), { ssr: false })

export default function Page() {
  return <GioGPT />
}
