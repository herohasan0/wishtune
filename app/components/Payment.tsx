import React, { useEffect } from "react";

export default function Payment({ formResponse }: { formResponse: any }) {
  useEffect(() => {
    if (formResponse) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = formResponse;

      const scripts = tempDiv.getElementsByTagName("script");
      Array.from(scripts).forEach((script) => {
        const newScript = document.createElement("script");
        newScript.type = "text/javascript";
        newScript.text = script.text;
        document.head.appendChild(newScript);
      });
    }
  }, [formResponse]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div id="iyzipay-checkout-form" className="responsive" />
    </div>
  );
}
