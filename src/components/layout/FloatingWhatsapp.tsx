"use client";
import { motion } from "framer-motion";

const FloatingWhatsApp = () => {
	const whatsappUrl = "https://wa.me/message/QH63ZFF2HQA3O1";

	return (
		<motion.a
			href={whatsappUrl}
			target="_blank"
			rel="noopener noreferrer"
			drag
			dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.9 }}
			className="fixed bottom-6 right-6 z-9999 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg cursor-grab active:cursor-grabbing"
			style={{ touchAction: "none" }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="30"
				height="30"
				fill="none"
				viewBox="0 0 20 20"
			>
				<path
					fill="#fff"
					d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10a9.96 9.96 0 0 1-4.863-1.26l-.305-.178-3.032.892a1.01 1.01 0 0 1-1.28-1.145l.026-.109.892-3.032A9.96 9.96 0 0 1 0 10C0 4.477 4.477 0 10 0m0 2a8 8 0 0 0-6.759 12.282c.198.312.283.696.216 1.077l-.039.163-.441 1.501 1.501-.441c.433-.128.883-.05 1.24.177A8 8 0 1 0 10 2M7.102 5.184a.7.7 0 0 1 .684.075c.504.368.904.862 1.248 1.344l.327.474.153.225a.71.71 0 0 1-.046.864l-.075.076-.924.686a.23.23 0 0 0-.067.291c.21.38.581.947 1.007 1.373.427.426 1.02.822 1.426 1.055.088.05.194.034.266-.031l.038-.045.601-.915a.71.71 0 0 1 .973-.158l.543.379c.54.385 1.059.799 1.47 1.324a.7.7 0 0 1 .089.703c-.396.924-1.399 1.711-2.441 1.673l-.159-.01-.191-.018-.108-.014-.238-.04c-.924-.174-2.405-.698-3.94-2.232-1.534-1.535-2.058-3.016-2.232-3.94l-.04-.238-.025-.208-.013-.175-.004-.075c-.038-1.044.753-2.047 1.678-2.443"
				></path>
			</svg>
		</motion.a>
	);
};

export default FloatingWhatsApp;

// "use client";
// import { motion } from "framer-motion";
// import { MessageCircle } from "lucide-react";
// import { useRef } from "react";

// const FloatingWhatsApp = () => {
// 	const whatsappUrl = "https://wa.me/message/QH63ZFF2HQA3O1";
// 	const dragArea = useRef(null);

// 	const handleTap = () => {
// 		window.open(whatsappUrl, "_blank", "noopener,noreferrer");
// 	};

// 	return (
// 		<div
// 			ref={dragArea}
// 			className="fixed inset-0 pointer-events-none z-9999"
// 		>
// 			<motion.div
// 				drag
// 				dragConstraints={dragArea}
// 				dragElastic={0.1}
// 				dragMomentum={false}
// 				onTap={handleTap}
// 				whileHover={{ scale: 1.1 }}
// 				whileTap={{ scale: 0.9 }}
// 				className="fixed bottom-6 right-6 pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg cursor-grab active:cursor-grabbing"
// 				style={{ touchAction: "none" }}
// 			>
// 				<MessageCircle size={32} />
// 			</motion.div>
// 		</div>
// 	);
// };

// export default FloatingWhatsApp;
