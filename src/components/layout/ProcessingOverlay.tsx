const ProcessingOverlay = ({ isVisible }: { isVisible: boolean }) => {
	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4 text-center shadow-xl">
				<div className="w-12 h-12 border-4 border-sartorial-green border-t-transparent rounded-full animate-spin" />
				<h2 className="text-xl font-semibold text-gray-800">
					Processing your order...
				</h2>
				<p className="text-sm text-gray-500">
					Please don&apos;t close this tab or go back. This will only
					take a moment.
				</p>
			</div>
		</div>
	);
};

export default ProcessingOverlay;
