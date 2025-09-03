'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';
import { files } from '@/lib/files';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

const EditorContext = createContext();

/**
 * The EditorProvider component acts as the Coordinator Agent.
 * It manages the entire state of the IDE, including the WebContainer instance,
 * file system, active file, terminal, and preview.
 * It provides all the state and agent functions to the rest of the application.
 */
export const EditorProvider = ({ children }) => {
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // File System State
    const [fileTree, setFileTree] = useState([]);
    const [activeFile, setActiveFile] = useState('index.js');
    const [fileContent, setFileContent] = useState('');

    // Console & Process State
    const [isInstalling, setIsInstalling] = useState(false);
    const [isServerRunning, setIsServerRunning] = useState(false);

    // Preview State
    const [previewUrl, setPreviewUrl] = useState('');

    // Refs for WebContainer, Terminal, etc.
    const webcontainerInstance = useRef(null);
    const terminalRef = useRef(null);
    const terminalInstance = useRef(null);

    // --- AGENT LOGIC ---

    // 1. WebContainer Initialization Agent
    useEffect(() => {
        const bootWebContainer = async () => {
            try {
                const wc = await WebContainer.boot();
                webcontainerInstance.current = wc;

                // Preview Agent: Listen for the server to be ready
                wc.on('server-ready', (port, url) => setPreviewUrl(url));

                // File Agent: Mount initial files
                await wc.mount(files);
                const initialFiles = await wc.fs.readdir('/', { withFileTypes: true });
                setFileTree(initialFiles.filter(f => f.isFile()));

                setIsLoading(false);
            } catch (error) {
                console.error('Error booting WebContainer:', error);
                setIsLoading(false);
            }
        };
        bootWebContainer();
    }, []);

    // 2. File Reader Agent: Reads file content when activeFile changes
    useEffect(() => {
        if (!activeFile || !webcontainerInstance.current) return;
        const readFile = async () => {
            try {
                const content = await webcontainerInstance.current.fs.readFile(`/${activeFile}`, 'utf-8');
                setFileContent(content);
            } catch (error) {
                console.error(`Error reading file ${activeFile}:`, error);
            }
        };
        readFile();
    }, [activeFile]);

    // 3. Console Agent: Initializes the terminal
    useEffect(() => {
        if (isLoading || !terminalRef.current || terminalInstance.current) return;
        const initTerminal = async () => {
            const fitAddon = new FitAddon();
            const terminal = new Terminal({ convertEol: true, cursorBlink: true, theme: { background: '#000000' } });
            terminal.loadAddon(fitAddon);
            terminal.open(terminalRef.current);
            fitAddon.fit();
            terminalInstance.current = terminal;

            // Spawn a shell and connect it to the terminal
            const shellProcess = await webcontainerInstance.current.spawn('jsh');
            shellProcess.output.pipeTo(new WritableStream({
                write(data) { terminal.write(data); }
            }));
            const input = shellProcess.input.getWriter();
            terminal.onData(data => { input.write(data); });
        };
        initTerminal();
    }, [isLoading]);

    // 4. File Writer Agent: Saves file changes from the editor
    const handleEditorChange = (value) => {
        setFileContent(value);
        if (webcontainerInstance.current) {
            webcontainerInstance.current.fs.writeFile(`/${activeFile}`, value);
        }
    };

    // 5. Dependency Installer Agent
    const installDependencies = async () => {
        setIsInstalling(true);
        terminalInstance.current.write('\r\n\x1b[33mInstalling dependencies...\x1b[0m\r\n');
        const installProcess = await webcontainerInstance.current.spawn('npm', ['install']);
        installProcess.output.pipeTo(new WritableStream({
            write(data) { terminalInstance.current.write(data); }
        }));
        const exitCode = await installProcess.exit;
        setIsInstalling(false);
        if (exitCode !== 0) {
            terminalInstance.current.write(`\r\n\x1b[31mInstallation failed with exit code ${exitCode}\x1b[0m\r\n`);
        } else {
            terminalInstance.current.write('\r\n\x1b[32mDependencies installed successfully!\x1b[0m\r\n');
        }
    };

    // 6. Server Runner Agent
    const runServer = async () => {
        setIsServerRunning(true);
        terminalInstance.current.write('\r\n\x1b[33mStarting server...\x1b[0m\r\n');
        await webcontainerInstance.current.spawn('npm', ['run', 'start']);
    };

    // --- Context Provider Value ---
    const value = {
        isSidebarOpen, setIsSidebarOpen,
        isLoading,
        fileTree,
        activeFile, setActiveFile,
        fileContent, handleEditorChange,
        isInstalling, installDependencies,
        isServerRunning, runServer,
        previewUrl,
        terminalRef
    };

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
