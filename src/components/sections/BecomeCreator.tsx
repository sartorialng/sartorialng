import JoinCreatorModal from "@/components/modals/JoinCreatorModal";

const BecomeCreator = () => {
	return (
		<div className="w-full px-6 md:px-30 py-10 bg-gradient-to-r from-sartorial-green to-[#1A3D2B] flex flex-col md:flex-row items-center justify-between gap-6">
			<div className="text-center md:text-left">
				<h2 className="text-2xl md:text-3xl font-bold text-white">
					Become a Sartorial Creator
				</h2>
				<p className="mt-2 text-sm md:text-base text-white/70">
					Join our exclusive PR list and receive free products,
					early access & collaborations.
				</p>
			</div>

			<JoinCreatorModal />
		</div>
	);
};

export default BecomeCreator;
