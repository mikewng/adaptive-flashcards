import "./StudyDropdown.scss"
import { studyModesMapping } from "@/app/utils/studyModeLib";

const StudyDropdown = ({ onStudyOptionClick }) => {
    return (
        <div className="fc-studydropdown-cpnt-wrapper">
            {
                studyModesMapping.map((mode, i) => {
                    return (
                        <div className="fc-study-option-container" key={i}>
                            <div className="fc-option-name">{mode.name}</div>
                        </div>
                    )
                })
            }
        </div>
    )
}
export default StudyDropdown;