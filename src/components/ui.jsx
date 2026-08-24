import { Plus } from "lucide-react";

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="description">{description}</p>}
      </div>
      {children && <div className="heading-action">{children}</div>}
    </div>
  );
}
export function PrimaryButton({ children, onClick, icon: Icon = Plus, disabled = false, type }) {
  return (
    <button className="primary-button" onClick={onClick} disabled={disabled} type={type}>
      <Icon size={17} />
      {children}
    </button>
  );
}
