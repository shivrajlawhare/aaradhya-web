import EmptyState from '../../components/ui/empty-state';
import type { SectionConfig } from './settings-sections';

interface MasterListEmptyStateProps {
  section: SectionConfig;
}

// D16 — "No venues yet" / "No event types yet" / "No room types yet" / "No
// menu items yet", with the No Items illustration; shared by the desktop
// table and the mobile list.
const MasterListEmptyState = ({ section }: MasterListEmptyStateProps) => (
  <EmptyState illustration="no-items" title={`No ${section.label.toLowerCase()} yet`} />
);

export default MasterListEmptyState;
