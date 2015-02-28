using UnityEngine;
using UnityEditor;
using System.Collections;

public class DatInputManager : EditorWindow {
	
	public static int m_NumAxis = 1;
	public static int m_MaxPlayers = 1;
	public static InputAxis[] m_Controls = null;
	public static Vector2 m_ScrollPos;
	public static ControllerType m_ControllerType = ControllerType.Xbox360;
	
	public static string[] m_ControllerButtonsMap = new string[9];
	public static int[] m_ControllerAxisMapping = new int [8];
	
	/////////////////////////////////////
	//Constants and enumerations
	public enum ControllerType
	{
		none = 0,
		Xbox360 = 1,
		PS4 = 2
	};
	
	public enum AxisType
	{
		KeyOrMouseButton = 0,
		MouseMovement = 1,
		JoystickAxis = 2
	};
	
	public enum JoyButtonCode
	{
		none,
		FaceA, // PS4: Square Xbox360: X
		FaceB, // PS4: X XBox360: B
		FaceX, // PS4: Cricle XBox360: A
		FaceY, // PS4: Triangle XBox360: Y
		LeftBumper,
		RightBumper,
		LeftStickButton,
		RightStickButton,
		Start,
	}

	public enum AxisCode
	{
		none,
		XAxis,
		YAxis,
		ScrollWheel,
	}
	
	public enum JoyAxisCode
	{
		none,
		LeftStickX,
		LeftStickY,
		RightStickX,
		RightStickY,
		LeftTrigger,
		RightTrigger,
		DPadX,
		DPadY,
	}
	
	/////////////////////////////////////
	//Member Functions
	
	[MenuItem("Window/DatInput Manager...")]
    public static void ShowWindow()
    {
        //Show existing window instance. If one doesn't exist, make one.
        EditorWindow.GetWindow(typeof(DatInputManager), false, "DatInput");
		Start();
		
		
    }
	void Awake() {
		
	}
	// Use this for initialization
	static void Start () 
	{

		UpdateControlMapping(m_ControllerType);
		
		//check the input manager and see what axis we have from there
		SerializedObject serializedObject = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/InputManager.asset")[0]);
		SerializedProperty axesProperty = serializedObject.FindProperty("m_Axes");
		
		if(axesProperty.arraySize == 0 )
		{
			m_Controls = new InputAxis[1];
			m_Controls[0] = new InputAxis(){name = "0"};
			AddAxis(m_Controls[0]);
		}
		else
		{
			int numAxis = 0;
			int maxPlayers = 1;
			for(int i = 0; i < axesProperty.arraySize; i++)
			{	
				SerializedProperty axisProperty = axesProperty.GetArrayElementAtIndex(i);
				if(GetChildProperty(axisProperty, "joyNum").intValue > maxPlayers)
				{
					maxPlayers = GetChildProperty(axisProperty, "joyNum").intValue;
				}
				if(GetChildProperty(axisProperty, "joyNum").intValue != 1)
					continue;
				numAxis++;
			}
			m_MaxPlayers = maxPlayers;
			m_Controls = new InputAxis[numAxis];
			m_NumAxis = numAxis;
			for(int i = 0; i < m_NumAxis; i++)
			{	
				SerializedProperty axisProperty = axesProperty.GetArrayElementAtIndex(i);
				if(GetChildProperty(axisProperty, "joyNum").intValue != 1)
					continue;
				
				InputAxis axis = new InputAxis();
				axis.name = GetChildProperty(axisProperty, "m_Name").stringValue;
				axis.name = axis.name.Remove(0, 5);
				axis.descriptiveName = GetChildProperty(axisProperty, "descriptiveName").stringValue;
				axis.descriptiveNegativeName = GetChildProperty(axisProperty, "descriptiveNegativeName").stringValue;
				axis.negativeButton = GetChildProperty(axisProperty, "negativeButton").stringValue;
				axis.positiveButton = GetChildProperty(axisProperty, "positiveButton").stringValue;
				
				if(axis.positiveButton.Contains("joystick"))
				{
					for(int codes = 0; codes < m_ControllerButtonsMap.Length; codes++)
					{
						if(axis.positiveButton.Contains(m_ControllerButtonsMap[codes]))
						{
							axis.positiveJoyButton = (JoyButtonCode)(codes+1);
							break;
						}
					}
				}
				
				if(axis.negativeButton.Contains("joystick"))
				{
					for(int codes = 0; codes < m_ControllerButtonsMap.Length; codes++)
					{
						if(axis.negativeButton.Contains(m_ControllerButtonsMap[codes]))
						{
							axis.negativeJoyButton = (JoyButtonCode)(codes+1);
							break;
						}
					}
				}
				
				axis.altNegativeButton = GetChildProperty(axisProperty, "altNegativeButton").stringValue;
				axis.altPositiveButton = GetChildProperty(axisProperty, "altPositiveButton").stringValue;
				axis.gravity = GetChildProperty(axisProperty, "gravity").floatValue;
				axis.dead = GetChildProperty(axisProperty, "dead").floatValue;
				axis.sensitivity = GetChildProperty(axisProperty, "sensitivity").floatValue;
				axis.snap = GetChildProperty(axisProperty, "snap").boolValue;
				axis.invert = GetChildProperty(axisProperty, "invert").boolValue;
				axis.type = (AxisType)GetChildProperty(axisProperty, "type").intValue;
				axis.axis = (AxisCode)GetChildProperty(axisProperty, "axis").intValue;
				if(axis.type == AxisType.MouseMovement)
				{
					axis.axis = (AxisCode)(axis.axis + 1);
				}
				else
				if(axis.type == AxisType.JoystickAxis)
				{
					for(int a = 0; a < m_ControllerAxisMapping.Length; a++)
					{
						if((int)axis.axis == m_ControllerAxisMapping[a])
							axis.joyAxis = (JoyAxisCode)(a+1);
					}
				}
				
				
				axis.joyNum = GetChildProperty(axisProperty, "joyNum").intValue;
				m_Controls[i] = axis;
				Debug.Log("Added axis for "+axis.joyNum);
			}
		}
	}
	
	// Update is called once per frame
	void Update () {
	
	}
	
	
	void OnGUI()
	{
		m_ScrollPos = EditorGUILayout.BeginScrollView(m_ScrollPos, false, true);
	
		
		if(GUILayout.Button("Save Changes"))
		{
			//commit changes
			ClearInputSettings();
			for(int n = 0; n < m_MaxPlayers; n++)
			{
				for(int i = 0; i < m_NumAxis; i++)
				{
					m_Controls[i].joyNum = n+1;
					if((m_Controls[i].type == AxisType.MouseMovement || 
					  ((m_Controls[i].altNegativeButton.Length == 1 || m_Controls[i].altPositiveButton.Length == 1) &&
					   m_Controls[i].positiveJoyButton == JoyButtonCode.none && m_Controls[i].negativeJoyButton == JoyButtonCode.none)) &&
					   n > 0)
					   {
					   }
					   else
					   {
							AddAxisPlayer(n,m_Controls[i]);
					   }
					
				}
			}
		}
		EditorGUI.BeginChangeCheck ();
			m_ControllerType = (ControllerType)EditorGUILayout.EnumPopup("Default Controller Type",m_ControllerType);
		if (EditorGUI.EndChangeCheck ()) 
		{
			if(GUI.changed)
			{
				UpdateControlMapping(m_ControllerType);
			}
		}
		
	
		m_MaxPlayers = EditorGUILayout.IntField("Max Controllers", m_MaxPlayers);
		EditorGUI.BeginChangeCheck ();
			m_NumAxis = EditorGUILayout.IntField("Num Axes", m_NumAxis);
		if (EditorGUI.EndChangeCheck ()) 
		{
			if(GUI.changed && m_NumAxis > 0)
			{
				Debug.Log(m_NumAxis);
				InputAxis[] oldControls = m_Controls;
				
				m_Controls = new InputAxis[m_NumAxis];
				for(int i = 0; i < m_NumAxis; i++)
				{
					if(i < oldControls.Length)
						m_Controls[i] = oldControls[i];
					else
						m_Controls[i] = new InputAxis(){name = " "+i};
				}
			}
		}
		GUILayout.Label ("Axis Definitions \n(Note: Use the generic joystick syntax for buttons e.g. joystick button 0)", EditorStyles.boldLabel);
		
		for(int i = 0; i < m_Controls.Length; i++)
		{
			m_Controls[i].show = EditorGUILayout.Foldout(m_Controls[i].show,m_Controls[i].name);
			if(!m_Controls[i].show)
				continue;
			
			
			m_Controls[i].name = EditorGUILayout.TextField("Name", m_Controls[i].name);
			m_Controls[i].descriptiveName = EditorGUILayout.TextField("Descriptive Name", m_Controls[i].descriptiveName);
			m_Controls[i].descriptiveNegativeName = EditorGUILayout.TextField("Descriptive Negative Name", m_Controls[i].descriptiveNegativeName);
			m_Controls[i].type = (AxisType)EditorGUILayout.EnumPopup("Type", m_Controls[i].type );
			if(m_Controls[i].type == AxisType.KeyOrMouseButton)
			{
				m_Controls[i].positiveJoyButton = (JoyButtonCode)EditorGUILayout.EnumPopup("Joy Button +", m_Controls[i].positiveJoyButton);
				m_Controls[i].negativeJoyButton = (JoyButtonCode)EditorGUILayout.EnumPopup("Joy Button -", m_Controls[i].negativeJoyButton);
				
				//We do not read these in because they are set by the joy button type
				//m_Controls[i].negativeButton = EditorGUILayout.TextField("Negative Button", m_Controls[i].negativeButton);
				//m_Controls[i].positiveButton = EditorGUILayout.TextField("Positive Button", m_Controls[i].positiveButton);
				
				m_Controls[i].altPositiveButton = EditorGUILayout.TextField("Alt Button +", m_Controls[i].altPositiveButton);
				m_Controls[i].altNegativeButton = EditorGUILayout.TextField("Alt Button -", m_Controls[i].altNegativeButton);
				
				
				
			}
			
			m_Controls[i].gravity = EditorGUILayout.FloatField("Gravity", m_Controls[i].gravity);
			m_Controls[i].snap = EditorGUILayout.Toggle("Snap", m_Controls[i].snap );
			m_Controls[i].sensitivity = EditorGUILayout.FloatField("Sensitivity", m_Controls[i].sensitivity );

			
			m_Controls[i].invert = EditorGUILayout.Toggle("Invert", m_Controls[i].invert );
			
			if(m_Controls[i].type == AxisType.MouseMovement)
			{
				m_Controls[i].dead = EditorGUILayout.FloatField("Dead", m_Controls[i].dead);
				m_Controls[i].axis = (AxisCode)EditorGUILayout.EnumPopup("Mouse Axis", m_Controls[i].axis);
			}
			
			if(m_Controls[i].type == AxisType.JoystickAxis)
			{
				m_Controls[i].dead = EditorGUILayout.FloatField("Dead", m_Controls[i].dead);
				m_Controls[i].joyAxis = (JoyAxisCode)EditorGUILayout.EnumPopup("Joystick Axis", m_Controls[i].joyAxis);
			}
			
			EditorGUILayout.BeginHorizontal();
			EditorGUILayout.Space();
			EditorGUILayout.Space();
			EditorGUILayout.Space();
			EditorGUILayout.Space();
			EditorGUILayout.Space();
			if(GUILayout.Button("Remove"))
			{
				InputAxis[] newControls = new InputAxis[m_Controls.Length-1];
				int count = 0;
				for(int n = 0; n < m_Controls.Length; n++)
				{
					if(n != i)
					{
					
					 newControls[count] = m_Controls[n];
					 count++;
					 }
				}				
				m_Controls = newControls;
			}
			EditorGUILayout.EndHorizontal();
		}
		EditorGUILayout.EndScrollView();
	
	}
	
	private static void ClearInputSettings()
	{
		//open the default unity input manager as an asset/serialized object so we can access its properties
		SerializedObject serializedObject = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/InputManager.asset")[0]);
		SerializedProperty axesProperty = serializedObject.FindProperty("m_Axes");
		axesProperty.ClearArray();
		serializedObject.ApplyModifiedProperties();
	}
	
	//Helper function to get at child properties of a serialized property
	private static SerializedProperty GetChildProperty(SerializedProperty parent, string name)
	{
		SerializedProperty child = parent.Copy();
		child.Next(true);
		do
		{
			if (child.name == name) return child;
		}
		while (child.Next(false));
		return null;
	}
	
	//check if an axis exists or is already defined
	private static bool IsAxisDefined(string axisName)
	{
		SerializedObject serializedObject = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/InputManager.asset")[0]);
		SerializedProperty axesProperty = serializedObject.FindProperty("m_Axes");

		axesProperty.Next(true);
		axesProperty.Next(true);
		while (axesProperty.Next(false))
		{
			SerializedProperty axis = axesProperty.Copy();
			axis.Next(true);
			if (axis.stringValue == axisName) return true;
		}
		return false;
	}
	
	
	
	public static void UpdateControlMapping(ControllerType type)
	{
	
		if (Application.platform == RuntimePlatform.OSXEditor || Application.platform == RuntimePlatform.OSXPlayer)
		{
			if(type == ControllerType.Xbox360)
			{
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceA-1] = "button 1";
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceB-1] = "button 2";
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceX-1] = "button 0";
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceY-1] = "button 3";
				m_ControllerButtonsMap[(int)JoyButtonCode.LeftBumper-1] = "button 4";
				m_ControllerButtonsMap[(int)JoyButtonCode.RightBumper-1] = "button 5";
				m_ControllerButtonsMap[(int)JoyButtonCode.LeftStickButton-1] = "button 11";
				m_ControllerButtonsMap[(int)JoyButtonCode.RightStickButton-1] = "button 12";
				m_ControllerButtonsMap[(int)JoyButtonCode.Start-1] = "button 13";
				
			}
			else
			if(type == ControllerType.PS4)
			{
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceA-1] = "button 16";
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceB-1] = "button 17";
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceX-1] = "button 18";
				m_ControllerButtonsMap[(int)JoyButtonCode.FaceY-1] = "button 19";
				m_ControllerButtonsMap[(int)JoyButtonCode.LeftBumper-1] = "button 13";
				m_ControllerButtonsMap[(int)JoyButtonCode.RightBumper-1] = "button 14";
				m_ControllerButtonsMap[(int)JoyButtonCode.LeftStickButton-1] = "button 11";
				m_ControllerButtonsMap[(int)JoyButtonCode.RightStickButton-1] = "button 12";
				m_ControllerButtonsMap[(int)JoyButtonCode.Start-1] = "button 9";
			}
			
			m_ControllerAxisMapping[(int)JoyAxisCode.LeftStickX-1] = 0;
			m_ControllerAxisMapping[(int)JoyAxisCode.LeftStickY-1] = 1;
			m_ControllerAxisMapping[(int)JoyAxisCode.RightStickX-1] = 2;
			m_ControllerAxisMapping[(int)JoyAxisCode.RightStickY-1] =3;
			m_ControllerAxisMapping[(int)JoyAxisCode.LeftTrigger-1] = 4;
			m_ControllerAxisMapping[(int)JoyAxisCode.RightTrigger-1] = 5;
			m_ControllerAxisMapping[(int)JoyAxisCode.DPadX-1] = 6;
			m_ControllerAxisMapping[(int)JoyAxisCode.DPadY-1] = 7;
		}
		else if (Application.platform == RuntimePlatform.WindowsEditor || Application.platform == RuntimePlatform.WindowsPlayer)
		{
			
			//Windows treats all controllers as the same
			m_ControllerButtonsMap[(int)JoyButtonCode.FaceA-1] = "button 0";
			m_ControllerButtonsMap[(int)JoyButtonCode.FaceB-1] = "button 1";
			m_ControllerButtonsMap[(int)JoyButtonCode.FaceX-1] = "button 2";
			m_ControllerButtonsMap[(int)JoyButtonCode.FaceY-1] = "button 3";
			m_ControllerButtonsMap[(int)JoyButtonCode.LeftBumper-1] = "button 4";
			m_ControllerButtonsMap[(int)JoyButtonCode.RightBumper-1] = "button 5";
			m_ControllerButtonsMap[(int)JoyButtonCode.LeftStickButton-1] = "button 8";
			m_ControllerButtonsMap[(int)JoyButtonCode.RightStickButton-1] = "button 9";
			m_ControllerButtonsMap[(int)JoyButtonCode.Start-1] = "button 7";
			
			m_ControllerAxisMapping[(int)JoyAxisCode.LeftStickX-1] = 0;
			m_ControllerAxisMapping[(int)JoyAxisCode.LeftStickY-1] = 1;
			m_ControllerAxisMapping[(int)JoyAxisCode.RightStickX-1] = 3;
			m_ControllerAxisMapping[(int)JoyAxisCode.RightStickY-1] = 4;
			m_ControllerAxisMapping[(int)JoyAxisCode.LeftTrigger-1] = 2;
			m_ControllerAxisMapping[(int)JoyAxisCode.RightTrigger-1] = 2;
			m_ControllerAxisMapping[(int)JoyAxisCode.DPadX-1] = 6;
			m_ControllerAxisMapping[(int)JoyAxisCode.DPadY-1] = 7;
			
		}
	}
	
	[System.Serializable]
	public class InputAxis
	{
		public string name = "";
		public string descriptiveName = "";
		public string descriptiveNegativeName = "";
		
		public JoyButtonCode positiveJoyButton;	
		public JoyButtonCode negativeJoyButton;
		
		public string negativeButton = "";
		public string positiveButton = "";
		public string altNegativeButton = "";
		public string altPositiveButton = "";

		public float gravity;
		public float dead;
		public float sensitivity = 1;

		public bool snap = false;
		public bool invert = false;

		public AxisType type;

		public JoyAxisCode joyAxis;
		
		public AxisCode axis;
		public int joyNum;
		
		//for the editor only
		public bool show = false;
	}
	
	private static void UpdateAxis(InputAxis axis)
	{
		SerializedObject serializedObject = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/InputManager.asset")[0]);
		SerializedProperty axesProperty = serializedObject.FindProperty("m_Axes");
		//for(var
	}
	
	private static void AddAxis(InputAxis axis)
	{
		SerializedObject serializedObject = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/InputManager.asset")[0]);
		SerializedProperty axesProperty = serializedObject.FindProperty("m_Axes");

		axesProperty.arraySize++;
		serializedObject.ApplyModifiedProperties();
		SerializedProperty axisProperty = axesProperty.GetArrayElementAtIndex(axesProperty.arraySize - 1);

		GetChildProperty(axisProperty, "m_Name").stringValue = axis.name;
		GetChildProperty(axisProperty, "descriptiveName").stringValue = axis.descriptiveName;
		GetChildProperty(axisProperty, "descriptiveNegativeName").stringValue = axis.descriptiveNegativeName;
		GetChildProperty(axisProperty, "negativeButton").stringValue = axis.negativeButton;
		GetChildProperty(axisProperty, "positiveButton").stringValue = axis.positiveButton;
		GetChildProperty(axisProperty, "altNegativeButton").stringValue = axis.altNegativeButton;
		GetChildProperty(axisProperty, "altPositiveButton").stringValue = axis.altPositiveButton;
		GetChildProperty(axisProperty, "gravity").floatValue = axis.gravity;
		GetChildProperty(axisProperty, "dead").floatValue = axis.dead;
		GetChildProperty(axisProperty, "sensitivity").floatValue = axis.sensitivity;
		GetChildProperty(axisProperty, "snap").boolValue = axis.snap;
		GetChildProperty(axisProperty, "invert").boolValue = axis.invert;
		GetChildProperty(axisProperty, "type").intValue = (int)axis.type;
		GetChildProperty(axisProperty, "axis").intValue = (int)(axis.axis - 1);
		GetChildProperty(axisProperty, "joyNum").intValue = axis.joyNum;

		serializedObject.ApplyModifiedProperties();
	}
	
	public static void AddAxisPlayer(int player, InputAxis axis)
	{
		SerializedObject serializedObject = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/InputManager.asset")[0]);
		SerializedProperty axesProperty = serializedObject.FindProperty("m_Axes");

		axesProperty.arraySize++;
		serializedObject.ApplyModifiedProperties();

		SerializedProperty axisProperty = axesProperty.GetArrayElementAtIndex(axesProperty.arraySize - 1);

		GetChildProperty(axisProperty, "m_Name").stringValue = "Joy"+player+" "+axis.name;
		GetChildProperty(axisProperty, "descriptiveName").stringValue = axis.descriptiveName;
		GetChildProperty(axisProperty, "descriptiveNegativeName").stringValue = axis.descriptiveNegativeName;
		
		if(axis.positiveJoyButton != JoyButtonCode.none)
		{
			GetChildProperty(axisProperty, "positiveButton").stringValue = "joystick "+(player+1)+" "+m_ControllerButtonsMap[(int)axis.positiveJoyButton-1];
		}
		else
		{
			GetChildProperty(axisProperty, "positiveButton").stringValue = "";
		}
		if(axis.negativeJoyButton != JoyButtonCode.none)
		{
			GetChildProperty(axisProperty, "negativeButton").stringValue = "joystick "+(player+1)+" "+m_ControllerButtonsMap[(int)axis.negativeJoyButton-1];
		}
		else
		{
			GetChildProperty(axisProperty, "negativeButton").stringValue = "";
		}
		
		GetChildProperty(axisProperty, "altNegativeButton").stringValue = (player > 0 && axis.altNegativeButton.Length == 1) ? "" : axis.altNegativeButton;
		GetChildProperty(axisProperty, "altPositiveButton").stringValue = (player > 0 && axis.altPositiveButton.Length == 1) ? "" : axis.altPositiveButton;
		
		GetChildProperty(axisProperty, "gravity").floatValue = axis.gravity;
		GetChildProperty(axisProperty, "dead").floatValue = axis.dead;
		GetChildProperty(axisProperty, "sensitivity").floatValue = axis.sensitivity;
		GetChildProperty(axisProperty, "snap").boolValue = axis.snap;
		GetChildProperty(axisProperty, "invert").boolValue = axis.invert;
		GetChildProperty(axisProperty, "type").intValue = (int)axis.type;
		
		if(axis.joyAxis != JoyAxisCode.none)
			GetChildProperty(axisProperty, "axis").intValue = m_ControllerAxisMapping[(int)axis.joyAxis-1];
		else
			GetChildProperty(axisProperty, "axis").intValue = (int)(axis.axis - 1);
		GetChildProperty(axisProperty, "joyNum").intValue = player+1;

		serializedObject.ApplyModifiedProperties();
	}
}