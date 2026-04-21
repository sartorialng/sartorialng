import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SelectOption {
	value: string;
	label: string;
}

interface CustomSelectProps {
	placeholder?: string;
	items: SelectOption[];
	containerStyle?: string;
	label?: string;
	labelStyle?: string;
	inputStyle?: string;
	name?: string;
	value?: string;
	touched?: boolean;
	error?: string | boolean;
	onValueChange?: (value: string) => void;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CustomSelect = ({
	placeholder,
	items,
	containerStyle,
	label,
	labelStyle,
	inputStyle,
	name,
	value,
	touched,
	error,
	onValueChange,
	onChange,
}: CustomSelectProps) => {
	const hasError = touched && error;

	const handleChange = (newValue: string) => {
		if (onChange && name) {
			const syntheticEvent = {
				target: {
					name,
					value: newValue,
				},
			};
			onChange(syntheticEvent as React.ChangeEvent<HTMLSelectElement>);
		} else if (onValueChange) {
			onValueChange(newValue);
		}
	};

	return (
		<div className={cn("grid w-full items-center gap-3", containerStyle)}>
			{label && <Label className={labelStyle}>{label}</Label>}

			<Select onValueChange={handleChange} value={value}>
				<SelectTrigger
					className={cn(
						inputStyle,
						"pl-4 pr-4",
						hasError
							? "border-destructive focus-visible:ring-destructive"
							: "",
					)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>

				<SelectContent>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{hasError && (
				<p className="text-destructive text-sm">{String(error)}</p>
			)}
		</div>
	);
};

export default CustomSelect;
