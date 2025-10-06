# Unsaved Changes Warning System

## ✅ **Implemented Features:**

### **1. Change Detection**
- **Form Change Tracking**: Detects when user modifies any form field
- **State Management**: `hasUnsavedChanges` state tracks if there are pending changes
- **Visual Indicators**: Save button changes color and text when there are unsaved changes

### **2. Team Switch Warning**
- **Intercept Team Selection**: When user clicks on a different team with unsaved changes
- **Warning Modal**: Shows confirmation dialog before switching teams
- **Options**: User can either "Cancel" (stay on current team) or "Discard changes" (switch teams)

### **3. Browser Navigation Warning**
- **beforeunload Event**: Warns user when trying to leave the page/close browser
- **Browser Dialog**: Standard browser confirmation dialog
- **Automatic**: Only shows when there are actual unsaved changes

### **4. Visual Feedback**
- **Unsaved Changes Indicator**: Shows "⚠️ Alterações não salvas" next to save button
- **Button State Changes**: 
  - Normal: "Salvar Configuração" (blue)
  - With changes: "Salvar Alterações" (amber/orange)
- **Team Display**: Shows "Editando: {teamType}" to clarify which team is being edited

## 🎯 **User Experience Flow:**

### **Scenario 1: Making Changes**
1. User selects a team (e.g., Carteira II)
2. User modifies form fields (e.g., changes goal name)
3. ✅ **System detects changes** → Shows "Alterações não salvas" warning
4. ✅ **Save button changes** → "Salvar Alterações" (amber color)

### **Scenario 2: Switching Teams with Unsaved Changes**
1. User has unsaved changes in Carteira II
2. User clicks on Carteira IV button
3. ✅ **Warning modal appears**: "Você tem alterações não salvas..."
4. User can choose:
   - **"Cancelar"** → Stay on Carteira II, keep changes
   - **"Descartar alterações"** → Switch to Carteira IV, lose changes

### **Scenario 3: Leaving Page with Unsaved Changes**
1. User has unsaved changes
2. User tries to close browser tab or navigate away
3. ✅ **Browser warning appears**: "Você tem alterações não salvas. Tem certeza que deseja sair?"
4. User can choose to stay or leave

### **Scenario 4: Saving Changes**
1. User makes changes
2. User clicks "Salvar Alterações"
3. ✅ **Changes are saved** → `hasUnsavedChanges` resets to `false`
4. ✅ **Visual indicators disappear** → Button returns to normal state

## 🔧 **Technical Implementation:**

### **State Management:**
```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [pendingTeamSwitch, setPendingTeamSwitch] = useState<TeamType | null>(null);
const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
```

### **Change Detection:**
```typescript
const handleInputChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  onChange(); // Notify parent of changes
};
```

### **Browser Warning:**
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

### **Team Switch Protection:**
```typescript
const handleTeamSwitch = (newTeam: TeamType) => {
  if (hasUnsavedChanges && newTeam !== selectedTeam) {
    setPendingTeamSwitch(newTeam);
    setShowUnsavedWarning(true);
  } else {
    setSelectedTeam(newTeam);
    setHasUnsavedChanges(false);
  }
};
```

## ✅ **Benefits:**

1. **Prevents Data Loss**: Users can't accidentally lose their work
2. **Clear Feedback**: Visual indicators show when changes need to be saved
3. **User Control**: Users can choose to save or discard changes
4. **Professional UX**: Matches standard application behavior
5. **Non-Intrusive**: Only shows warnings when actually needed

## 🧪 **Testing Scenarios:**

1. **Make changes and switch teams** → Should show warning modal
2. **Make changes and try to leave page** → Should show browser warning
3. **Make changes and save** → Warnings should disappear
4. **Switch teams without changes** → Should switch immediately
5. **Make changes, get warning, click cancel** → Should stay on current team
6. **Make changes, get warning, click discard** → Should switch teams and lose changes

The system now provides comprehensive protection against accidental data loss while maintaining a smooth user experience!