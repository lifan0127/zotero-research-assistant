import React, { useEffect, useRef, useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid"
import stringify from "json-stringify-pretty-compact"
import { ToolStepContent, ToolStepControl } from "../../../../typings/steps"
import { ZoteroIcon } from "../../../icons/zotero"
import { runFunctionTool } from "../../../../models/tools"
import { CodeHighlighter } from "../../../components/code/CodeHighlighter"
import { tools } from "../../../../models/tools"
import { CSSTransition } from "react-transition-group"

export interface ToolStepProps {
  content: ToolStepContent
  control: ToolStepControl
}

export function ToolStep({ content, control }: ToolStepProps) {
  const {
    id,
    messageId,
    status,
    params: { id: toolCallId, name, parameters, output },
  } = content
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  const toolInfo =
    tools[name as "search_tag" | "search_creator" | "search_item"]
  const { scrollToEnd, pauseScroll, addFunctionCallOutput, updateBotStep } =
    control

  useEffect(() => {
    const runTool = async () => {
      const output = (await runFunctionTool(name, parameters)) || "No output"
      updateBotStep(messageId, id, {
        status: "COMPLETED",
        params: { name, parameters, output },
      } as Omit<ToolStepContent, "id" | "messageId">)
      addFunctionCallOutput(toolCallId, output)
      // scrollToEnd()
    }
    if (!output) {
      runTool()
    }
  }, [name, parameters])

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    setExpanded(!expanded)
    pauseScroll()
  }

  return (
    <div style={{ width: "fit-content" }} className="py-2">
      <span className="mr-2">
        <ZoteroIcon isLoading={status === "IN_PROGRESS"} />
      </span>
      <a
        href="#"
        onClick={handleClick}
        className="border-none bg-transparent m-0 p-0 text-black align-middle text-lg"
        style={{ textDecorationLine: "none" }}
      >
        Using tool <span className="font-bold">{toolInfo.title}</span>
        {status === "COMPLETED" ? (
          expanded ? (
            <ChevronUpIcon className="h-6 w-6 align-middle" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 align-middle" />
          )
        ) : null}
      </a>
      <CSSTransition
        nodeRef={ref}
        in={expanded}
        timeout={300}
        classNames="collapsible-panel"
        unmountOnExit
      >
        <div ref={ref} className="px-6 py-4 rounded-md bg-white text-base my-1">
          <div>{toolInfo.description}</div>
          <div className="max-h-60 overflow-auto">
            <CodeHighlighter
              code={stringify(parameters)}
              language="json"
              className="text-sm"
            />
          </div>
          {status === "COMPLETED" ? (
            <>
              <div>The following response was used:</div>
              <div className="max-h-60 overflow-auto">
                <pre
                  className="bg-amber-50 p-2"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {output}
                </pre>
              </div>
            </>
          ) : (
            <div>Waiting for response...</div>
          )}
        </div>
      </CSSTransition>
    </div>
  )
}
